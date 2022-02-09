using System.IO;
using LibSass.Compiler;
using LibSass.Compiler.Options;
using ThemeStudio.Models;

namespace ThemeStudio.Helper
{
    public static class SassCompile
    {
        public static string CompileContent(this TemplateContent content)
        {
            return CompileContent(content.ToString());
        }

        public static string CompileContent(string sassContent)
        {
            var options = new SassOptions
            {
                Data = sassContent
            };
            return Compile(options);
        }

        public static string CompileFile(this FileInfo path)
        {
            return CompileFile(path.FullName);
        }

        public static string CompileFile(string path)
        {
            var options = new SassOptions
            {
                InputPath = path
            };
            return Compile(options);
        }

        private static string Compile(SassOptions options)
        {
            var sass = new SassCompiler(options);
            var result = sass.Compile();
            return result.Output;
        }
    }
}