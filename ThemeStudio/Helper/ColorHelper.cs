using System;
using System.Drawing;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace ThemeStudio.Helper
{
    public static class ColorHelper
    {
        public static string ToHex(this Color color)
        {
            //return "#" + color.R.ToString("X2") + color.G.ToString("X2") + color.B.ToString("X2");
            return ColorTranslator.ToHtml(color);
        }

        public static string ToRgbaString(this Color color)
        {
            //return "#" + color.R.ToString("X2") + color.G.ToString("X2") + color.B.ToString("X2");
            return string.Format("rgba('{0}', '{1}', '{2}', '{3}')", color.R, color.G, color.B, color.A);
        }

        public static Color ParseColor(string cssColor)
        {
            try
            {
                cssColor = cssColor.Trim();
                if (cssColor.Contains("%"))
                {
                    var percentageStr = cssColor.Split(' ').LastOrDefault();
                    int percentage;
                    if (!string.IsNullOrEmpty(percentageStr) && int.TryParse(Regex.Match(percentageStr, @"\d+").Value, out percentage))
                    {
                        var color = ColorTranslator.FromHtml(cssColor.Replace(percentageStr, string.Empty));
                        return Color.FromArgb(percentage * 255 / 100, color.R, color.G, color.B);
                    }
                    return Color.FromName(cssColor);
                }
                if (cssColor.StartsWith("#"))
                {
                    return ColorTranslator.FromHtml(cssColor);
                }

                if (cssColor.StartsWith("rgb")) //rgb or argb
                {
                    int left = cssColor.IndexOf('(');
                    int right = cssColor.IndexOf(')');

                    if (left < 0 || right < 0)
                        throw new FormatException("rgba format error");
                    string noBrackets = cssColor.Substring(left + 1, right - left - 1);

                    string[] parts = noBrackets.Split(',');

                    int r = int.Parse(parts[0], CultureInfo.InvariantCulture);
                    int g = int.Parse(parts[1], CultureInfo.InvariantCulture);
                    int b = int.Parse(parts[2], CultureInfo.InvariantCulture);

                    if (parts.Length == 3)
                    {
                        return Color.FromArgb(r, g, b);
                    }

                    if (parts.Length == 4)
                    {
                        float a = float.Parse(parts[3], CultureInfo.InvariantCulture);
                        return Color.FromArgb((int)(a * 255), r, g, b);
                    }
                }

                return Color.FromName(cssColor);
            }
            catch
            {
                return Color.Empty;
            }
        }
    }
}