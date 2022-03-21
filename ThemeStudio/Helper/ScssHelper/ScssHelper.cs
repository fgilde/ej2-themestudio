using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Ajax.Utilities;
using ThemeStudio.Extensions;

namespace ThemeStudio.Helper.ScssHelper
{
    public static class ScssHelper
    {
        public static IEnumerable<ScssVariable> FillReferences(this IEnumerable<ScssVariable> variables)
        {
            return variables;
        }       
        
        public static string ToThemePropertiesJson(this IEnumerable<ScssVariable> variables)
        {
            var vars = variables.ToList();
            var suggestionCache = new Dictionary<ScssVariableType, ScssVariable[]>();
            
            var builder = new StringBuilder();
            builder.Append("{");
            for (var index = 0; index < vars.Count; index++)
            {
                var variable = vars[index];
                
                var suggestion = suggestionCache.ContainsKey(variable.Type) ? suggestionCache[variable.Type] : suggestionCache.AddValue(variable.Type, Suggestions(variable, vars));
                var paletteStr = string.Join(",", suggestion.Select(s => $"\"{s.Value}\""));

                builder.Append("\"" + variable.Name.Replace("Color", "") + "\" :{");
                builder.Append("\"id\": \"" + variable.Key.Replace("$", "") + "\",");
                builder.Append("\"default\": \"" + variable.Value + "\",");
                builder.Append("\"type\": " + (int)variable.Type + ",");
                builder.Append("\"palettes\": [" + paletteStr + "]");
                builder.Append("}");
                if (index < vars.Count - 1) builder.Append(",");
            }

            return builder.Append("}").ToString();
        }

        public static ScssVariable[] Suggestions(ScssVariable variable, IList<ScssVariable> variables)
        {
            var res = variables.Where(v => v.Type == variable.Type).DistinctBy(v => v.Value).OrderBy(s => s.Value).ToArray();
            if (variable.Type == ScssVariableType.Color)
                res = res.Where(v => !v.Value.Contains("%")).DistinctBy(v => ColorHelper.ParseColor(v.Value)).ToArray();
            
            return res;
        }

        public static IEnumerable<ScssVariable> ReadColorVariables(IEnumerable<string> fileNames)
        {
            return ReadEditableVariables(fileNames);
            //return ReadVariables(fileNames).Where(v => v.Type == ScssVariableType.Color && !v.HasVariableReference);
        }

        public static IEnumerable<ScssVariable> ReadEditableVariables(IEnumerable<string> fileNames)
        {
            
            return ReadVariables(fileNames).Where(v => (
                v.Type == ScssVariableType.Color 
                || v.Type == ScssVariableType.FontFamily 
                || v.Type == ScssVariableType.FontStyle 
                || v.Type == ScssVariableType.BooleanValue
                // || v.Type == ScssVariableType.VariableReference
                || v.Type == ScssVariableType.Number
                || v.Type == ScssVariableType.Size 
                )
             && !v.HasVariableReference);
        }

        public static IEnumerable<ScssVariable> ReadVariables(IEnumerable<string> fileNames)
        {
            var r = fileNames.SelectMany(ReadVariables).ToList().DistinctBy(v => v.Name).ToList();
            return r;
        }

        public static IEnumerable<ScssVariable> ReadVariables(string fileName)
        {
            return File.ReadAllLines(fileName).Select((l, idx) => TryParseLine(l, idx, fileName)).Where(v => v != null).DistinctBy(v => v.Name);
        }

        public static IEnumerable<ScssVariable> SaveChanges(this IEnumerable<ScssVariable> variables)
        {
            var scssVariables = variables as ScssVariable[] ?? variables.ToArray();
            if (scssVariables.Any())
            {
                foreach (var grouping in scssVariables.GroupBy(v => v.FileName))
                {
                    string[] lines = File.ReadAllLines(grouping.Key);
                    foreach (ScssVariable variable in grouping)
                    {
                        if (variable.Type == ScssVariableType.Color && variable.Value.StartsWith("rgb", StringComparison.InvariantCultureIgnoreCase))
                        {
                            variable.Value = ColorHelper.ParseColor(variable.Value).ToHex();
                        }

                        lines[variable.LineIndex] = variable.ToDeclaration(true);
                    }

                    File.WriteAllLines(grouping.Key, lines);
                }
            }
            return scssVariables;
        }

        public static string ConvertScssVariablesToCssVars(string scssFile, bool saveChangesToFile)
        {
            var content = File.ReadAllText(scssFile);
            var vars = ReadVariables(scssFile).Where(v => v.Type != ScssVariableType.Unknown).ToList();
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
                            line = replacements.Aggregate(line, (current, variable) => current.Replace(variable.Key, $"var({variable.CssVarame}) "));
                            //content = content.Replace($":{var.Key} ", $":var({cssVarName}) ");
                        }
                    }

                    result.AppendLine(line);

                } while (line != null);
            }

            return result.ToString();
        }

        internal static string[] UsedVariables(string s, bool allowUsingInFunctions)
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

        private static ScssVariable TryParseLine(string line, int lineIndex, string filename)
        {
            if (!string.IsNullOrEmpty(line) && line.StartsWith("$") && line.Contains(":"))
            {
                if (line.Contains("active-bg-color"))
                {

                }
                var parts = line.Split(':');
                if (parts.Length == 2)
                {
                    string key = parts[0];
                    bool hasDefaultFlag = parts[1].Contains("!default");
                    string value = parts[1].Replace("!default;", "");
                    return new ScssVariable(key, value, hasDefaultFlag, filename, lineIndex);
                }
            }
            return null;
        }
    }
}