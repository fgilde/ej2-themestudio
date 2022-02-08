using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using Microsoft.Ajax.Utilities;

namespace ThemeStudio
{

    public class ScssVariable
    {
        private static string[] knownFonts = FontFamily.Families.Select(f => f.Name.ToLower()).ToArray();
        private static string[] knownStyles = Enum.GetNames(typeof(FontStyle)).Concat(new []{"normal"}).Select(s => s.ToLower()).ToArray();
        public ScssVariable(string key, string value)
        {
            Key = key;
            Value = value.Trim();
            Name = string.Join(" ", key.Replace("$", "").Split('-').Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s[0].ToString().ToUpper() + s.Substring(1)));
            Type = GetVarType();
        }

        private ScssVariableType GetVarType()
        {
            bool b;
            int i;
            var value = Value.ToLower();
            if (value == "transparent" || Value.StartsWith("#") || value == "none" || value.StartsWith("rgba(") || value.StartsWith("rgb(") )
                return ScssVariableType.Color;
            if (Value.StartsWith("$"))
                return ScssVariableType.VariableReference;
            if (bool.TryParse(Value, out b) || (Value.Length > 3 && bool.TryParse(Value.Substring(1, Value.Length-2), out b)))
                return ScssVariableType.BooleanValue;
            if (int.TryParse(Value, out i))
                return ScssVariableType.Number;
            if (value.Contains("px") || value.Contains("rem") || value.Contains("pt"))
                return ScssVariableType.Size;
            if (knownFonts.Any(s => value.Contains(s)))
                return ScssVariableType.FontFamily;
            if (knownStyles.Any(s => value.Contains(s)))
                return ScssVariableType.FontStyle;
            return ScssVariableType.Unknown;
        }

        public string CssVarame => $"--{Key.Replace("$", "")}";
        public string Name { get; set; }
        public string Key { get; set; }
        public string Value { get; set; }
        public ScssVariableType Type { get; set; }
    }

    public enum ScssVariableType
    {
        Unknown,
        Color,
        VariableReference,
        BooleanValue,
        Size,
        FontFamily,
        FontStyle,
        Number
    }

    public enum CssVariableDeclaration
    {
        UseScssVariable,
        UseVariableValue
    }


    public static class ScssReader
    {
        public static IEnumerable<ScssVariable> ReadVariables(IEnumerable<string> fileNames)
        {
            return fileNames.SelectMany(ReadVariables).DistinctBy(v => v.Key);
        }

        public static IEnumerable<ScssVariable> ReadVariables(string fileName)
        {
            return File.ReadAllLines(fileName).Select(TryParseLine).Where(v => v != null).DistinctBy(v => v.Key);
        }

        public static string ConvertScssVariablesToCssVars(string scssFile, bool saveChangesToFile)
        {
            var content = File.ReadAllText(scssFile);
            //var vars = ReadVariables(scssFile).Where(v => v.Type == ScssVariableType.Color).ToList();
            var vars = ReadVariables(scssFile).Where(v => v.Type != ScssVariableType.Unknown).ToList();
            // var vars = ReadVariables(scssFile).ToList();
            var declarations = BuildCssVariableDeclarations(vars, CssVariableDeclaration.UseScssVariable);
            content = ReplaceScssVariableUsings(content, vars);

            var result = content + Environment.NewLine + declarations;
            if (saveChangesToFile)
                File.WriteAllText(scssFile, result);
            return result;
        }

        private static string ReplaceScssVariableUsings(string content, IList<ScssVariable> vars)
        {
            var result = new StringBuilder();
            using (StringReader reader = new StringReader(content))
            {
                string line = string.Empty;
                do
                {
                    line = reader.ReadLine();
                    if (line != null)
                    {
                        ScssVariable[] replacements;
                        if (CanReplaceUsing(line, vars, out replacements))
                        {
                            foreach (var variable in replacements)
                            {
                                line = line.Replace(variable.Key, $"var({variable.CssVarame}) ");
                            }
                            //content = content.Replace($":{var.Key} ", $":var({cssVarName}) ");

                        }
                    }

                    result.AppendLine(line);

                } while (line != null);
            }

            return result.ToString();
        }

        private static string[] UsedVariables(string s, bool allowUsingInFunctions)
        {
            if (!allowUsingInFunctions)
            {
                s = Regex.Replace(s, @"\(.*\)", "");
            }
            var collection = Regex.Matches(s, @"\$[a-z0-9-]+", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
            return (from Match m in collection select m.ToString()).ToArray();
        }

        private static bool CanReplaceUsing(string line, IList<ScssVariable> vars, out ScssVariable[] replacements)
        {
            replacements = Array.Empty<ScssVariable>();
            if (!string.IsNullOrWhiteSpace(line) && !line.TrimStart().StartsWith("$") && !line.TrimStart().StartsWith("@") && line.Contains("$"))
            {
                var usedVariablesInLine = UsedVariables(line, false);
                replacements = vars.Where(v => usedVariablesInLine.Any(w => w == v.Key)).ToArray();
                return replacements.Length > 0;
            }
            return false;
        }


        private static string BuildCssVariableDeclarations(IEnumerable<ScssVariable> vars, CssVariableDeclaration valueDeclaration)
        {
            var builder = new StringBuilder(":root {");
            foreach (var var in vars)
            {
                if (valueDeclaration == CssVariableDeclaration.UseVariableValue)
                {
                    builder.AppendLine().AppendLine($"{var.CssVarame}: {var.Value};");
                }
                else if(valueDeclaration == CssVariableDeclaration.UseScssVariable)
                {
                    builder.AppendLine().AppendLine($"{var.CssVarame}: {"#{" + var.Key + "}"};");
                }
            }

            builder.AppendLine().AppendLine("}");
            return builder.AppendLine().ToString();
        }

        private static ScssVariable TryParseLine(string line)
        {
            if (line.StartsWith("$"))
            {
                var parts = line.Split(':');
                if (parts.Length == 2)
                {
                    string key = parts[0];
                    string value = parts[1].Replace("!default;", "");
                    return new ScssVariable(key, value);
                }
            }
            return null;
        }
    }
}