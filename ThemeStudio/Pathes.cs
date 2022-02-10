using System;
using System.Collections.Generic;
using System.IO;
using ThemeStudio.Models;

namespace ThemeStudio
{
    public static class Pathes
    {
        
        public static string BasePath = AppDomain.CurrentDomain.BaseDirectory;
        public static string OutputZip = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, nameof(OutputZip));

        public static string Output => Path.Combine(BasePath, "outputs");
        public static string Template => Path.Combine(BasePath, "template");
        public static string Content => Path.Combine(BasePath, "Content");
        public static string ContentEj2 => Path.Combine(Content, "ej2");
        public static string Resources => Path.Combine(BasePath, "ej2-resource");
        public static string ResourceStyles => Path.Combine(Resources, "styles");
        public static string CssFile(string themeName) => Path.Combine(ContentEj2, $"{themeName}.css");
        public static string TemplateFile(string themeName, bool isDark = false) => isDark ? Path.Combine(Template, "dark", $"{themeName}.txt") : Path.Combine(Template, $"{themeName}.txt");
        public static string TemplateFile(ThemeProperties theme) => TemplateFile(theme.theme, theme.IsDark);
        public static string AllScssFile(string themeName) => Path.Combine(ResourceStyles, $"all{themeName}.scss");


        public static IEnumerable<string> GetAllScssFiles(string themeName) => Directory.EnumerateFiles(ResourceStyles, $"{themeName}.scss", SearchOption.AllDirectories);
        public static TemplateContent ReadTemplateContent(string themeName, bool isDark = false) => new TemplateContent(File.ReadAllText(TemplateFile(themeName, isDark)));
        public static TemplateContent ReadTemplateContent(ThemeProperties theme) => new TemplateContent(File.ReadAllText(TemplateFile(theme)));
        public static string ReadScssContent(string themeName) => File.ReadAllText(AllScssFile(themeName));
        public static string ReadCssContent(string themeName) => File.ReadAllText(CssFile(themeName));
    }
}