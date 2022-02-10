using System.IO;
using LibSass.Compiler;
using LibSass.Compiler.Options;
using ThemeStudio.Models;

namespace ThemeStudio.Helper
{
    public static class SassCompile
    {
        public static CompileResult CompileContent(this TemplateContent content)
        {
            return CompileContent(content.ToString());
        }

        public static CompileResult CompileContent(string sassContent)
        {
            var options = new SassOptions
            {
                Data = sassContent
            };
            return Compile(options);
        }

        public static CompileResult CompileFile(this FileInfo path)
        {
            return CompileFile(path.FullName);
        }

        public static CompileResult CompileFile(string path)
        {
            var options = new SassOptions
            {
                InputPath = path
            };
            return Compile(options);
        }

        private static CompileResult Compile(SassOptions options)
        {
            var sass = new SassCompiler(options);
            var result = sass.Compile();
            return new CompileResult(result, options.Data);
        }
    }
}