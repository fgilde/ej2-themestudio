using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using ThemeStudio.Models;

namespace ThemeStudio
{
    internal static class Paths
    {
        public const string DefaultTheme = "material";
        public static string WebRootPath { get; private set; }
        public static string OutputZip => Path.Combine(WebRootPath, "output", "zip");
        public static string Output => Path.Combine(WebRootPath, "output", "outputs");
        public static string Template => Path.Combine(WebRootPath, "template");
        public static string Content => Path.Combine(WebRootPath, "css");
        public static string ContentEj2 => Path.Combine(Content, "ej2");
        public static string Resources => Path.Combine(WebRootPath, "ej2-resource");
        public static string ResourceStyles => Path.Combine(Resources, "styles");
        public static string CssFile(string themeName) => Path.Combine(ContentEj2, $"{themeName}.css");
        public static string TemplateFile(string themeName, bool isDark = false) => isDark ? Path.Combine(Template, "dark", $"{themeName}.txt") : Path.Combine(Template, $"{themeName}.txt");
        public static string TemplateFile(ThemeProperties theme) => TemplateFile(theme.Theme, theme.IsDark);
        public static string AllScssFile(string themeName) => Path.Combine(ResourceStyles, $"all{themeName}.scss");
        public static IEnumerable<string> AvailableThemes() => Directory.EnumerateFiles(Template, "*.txt", SearchOption.TopDirectoryOnly).Select(Path.GetFileNameWithoutExtension);
        public static IEnumerable<string> GetAllScssFiles(string themeName, string[] components = null)
        {
            var res = Directory.EnumerateFiles(ResourceStyles, $"{themeName}.scss", SearchOption.AllDirectories);
            return (components?.Any() == true
                    ? res.Where(s =>
                        new[] {"base"}.Concat(components).Distinct().Contains(GetComponentNameByFileFilePath(s), StringComparer.InvariantCultureIgnoreCase))
                    : res)
                .OrderBy(Path.GetDirectoryName); // TODO: Better order. Everything under base needs to be on top
        }

        public static string GetComponentNameByFileFilePath(string fullFilePath) => Path.GetFileName(Path.GetDirectoryName(fullFilePath));
        public static TemplateContent ReadTemplateContent(string themeName, bool isDark = false) => new(File.ReadAllText(TemplateFile(themeName, isDark)));
        public static TemplateContent ReadTemplateContent(ThemeProperties theme) => new(File.ReadAllText(TemplateFile(theme)));
        public static string ReadScssContent(string themeName) => File.ReadAllText(AllScssFile(themeName));
        public static string ReadCssContent(string themeName) => File.ReadAllText(CssFile(themeName));
        
        internal static void SetRoot(string webRootPath)
        {
            WebRootPath = webRootPath;
        }
    }
}