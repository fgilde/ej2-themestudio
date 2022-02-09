using System;
using System.Drawing;
using System.Linq;

namespace ThemeStudio.Helper.ScssHelper
{
    public class ScssVariable
    {
        private static string[] knownFonts = FontFamily.Families.Select(f => f.Name.ToLower()).ToArray();
        private static string[] knownStyles = Enum.GetNames(typeof(FontStyle)).Concat(new[] { "normal" }).Select(s => s.ToLower()).ToArray();
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

        public string CssVarame => $"--{Key.Replace("$", "")}";
        public string Name { get; set; }
        public string Key { get; set; }
        public string Value { get; set; }
        public ScssVariableType Type { get; set; }
    }
}