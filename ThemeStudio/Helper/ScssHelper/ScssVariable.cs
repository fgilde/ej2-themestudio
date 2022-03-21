using System;
using System.Drawing;
using System.Linq;

namespace ThemeStudio.Helper.ScssHelper
{
    public class ScssVariable
    {
        private static string[] knownFonts = FontFamily.Families.Select(f => f.Name.ToLower()).ToArray();
        private static string[] knownStyles = Enum.GetNames(typeof(FontStyle)).Concat(new[] { "normal" }).Select(s => s.ToLower()).ToArray();
        
        public ScssVariable(string key, string value, bool hasDefaultFlag, string fileName, int lineIndex)
        {
            FileName = fileName;
            LineIndex = lineIndex;
            Key = key;
            HasDefaultFlag = hasDefaultFlag;
            OriginalValue = Value = value.Trim().TrimEnd(';');
            Name = GenerateNameByKey(key);
            Type = GetVarType();
            UsedVariabled = GetUsedVariables();
        }
        
        public string[] UsedVariabled { get; }
        
        public string FileName { get; }
        public int LineIndex { get; }
        public string CssVarame => $"--{Key.Replace("$", "")}";
        public string Name { get; set; }
        public string Key { get; set; }
        public bool HasDefaultFlag { get; }
        public string Flag => HasDefaultFlag ? "!default" : "";
        public string Value { get; set; }
        public string OriginalValue { get;}
        public ScssVariableType Type { get; set; }
        public bool HasVariableReference => UsedVariabled?.Any() == true;

        public override string ToString()
        {
            return ToDeclaration(true);
        }

        public string ToDeclaration(bool addFlag)
        {
            var flag = addFlag ? $" {Flag}" : "";
            return $"{Key}: {Value}{flag};";
        }

        private string[] GetUsedVariables()
        {
            return ScssHelper.UsedVariables(Value, true);
        }

        private static string GenerateNameByKey(string key)
        {
            return string.Join(" ", key.Replace("$", "").Split('-').Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s[0].ToString().ToUpper() + s.Substring(1)));
        }

        private ScssVariableType GetVarType()
        {
            bool b;
            int i;
            var value = Value.ToLower();
            if (value == "transparent" || Value.StartsWith("#") || value == "none" || value.StartsWith("rgba(") || value.StartsWith("rgb("))
                return ScssVariableType.Color;
            if (Value.StartsWith("$"))
                return ScssVariableType.VariableReference;
            if (bool.TryParse(Value, out b) || (Value.Length > 3 && bool.TryParse(Value.Substring(1, Value.Length - 2), out b)))
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
    }
}