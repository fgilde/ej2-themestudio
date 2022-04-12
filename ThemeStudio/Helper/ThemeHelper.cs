using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using ThemeStudio.Helper.ScssHelper;
using ThemeStudio.Models;

namespace ThemeStudio.Helper
{
    public static class ThemeHelper
    {
        public static ThemeProperties CreateNewTheme(CreateNewThemeModel model)
        {
            CreateNewTheme(model.Properties.Theme, model.BaseTheme);
            return model.Properties;
        }

        public static void CreateNewTheme(string theme, string baseTheme)
        {
            var isDark = baseTheme.Contains("-dark");
            Paths.ReadTemplateContent(baseTheme, isDark).SaveTo(Path.Combine(Paths.Template, isDark ? "dark" : "", $"{theme}.txt"));
            File.Copy(Paths.AllScssFile(baseTheme), Paths.AllScssFile(theme), true);
            foreach (var file in Paths.GetAllScssFiles(baseTheme))
                File.Copy(file, Path.Combine(Path.GetDirectoryName(file), $"{theme}{Path.GetExtension(file)}"), true);
        }

        public static void DeleteTheme(string theme)
        {
            var isDark = theme.Contains("-dark");
            File.Delete(Path.Combine(Paths.Template, isDark ? "dark" : "", $"{theme}.txt"));
            File.Delete(Paths.AllScssFile(theme));
            foreach (var file in Paths.GetAllScssFiles(theme).ToList()) // Ensure enumeration before deleting
                File.Delete(file);
        }

        public static IEnumerable<ScssVariable> UpdateVariablesForTheme(ThemeProperties theme, IEnumerable<string> files = null)
        {
            Func<KeyValuePair<string, string>, ScssVariable, bool> changeValue = (p, v) =>
            {
                if (p.Key == v.Key && p.Value != v.Value)
                {
                    v.Value = p.Value;
                    return true;
                }

                return false;
            };
            files ??= Paths.GetAllScssFiles(theme.Theme);
            return ScssHelper.ScssHelper.ReadVariables(files).Where(v => theme.Properties.Any(p => changeValue(p, v)));
        }
    }
}