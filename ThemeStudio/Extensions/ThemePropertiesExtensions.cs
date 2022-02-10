using System.IO;
using ThemeStudio.Helper;
using ThemeStudio.Models;

namespace ThemeStudio.Extensions
{
    public static class ThemePropertiesExtensions
    {
        public static ThemeProperties AddCompatibilityIf(this ThemeProperties exporting, string path, string sassContent)
        {
            if (exporting.compatiblity == "True")
            {
                path = Directory.CreateDirectory(path).FullName;
                var fileName = Path.Combine(path, $"{exporting.theme}.scss");
                File.WriteAllText(fileName,
                    "$css: '.e-css' !default;\n$imported-modules: () !default;\n .e-lib { \n @at-root {\n" +
                    sassContent +
                    "}\n& .e-js [class^='e-'], & .e-js [class*=' e-'] {\n  box-sizing: content-box;\n }\n}");
                
                File.WriteAllText(path + exporting.theme + ".css", SassCompile.CompileFile(fileName).CompiledContent);
            }

            return exporting;
        }
    }
}