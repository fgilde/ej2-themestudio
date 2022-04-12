using System.IO;
using LibSassHost;
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
            CompilationOptions options = new CompilationOptions();
           // options.IncludePaths = Directory.GetDirectories(Paths.ResourceStyles);
           CompilationResult r = SassCompiler.Compile(sassContent, options);
            return new CompileResult(r, sassContent);
        }

        public static CompileResult CompileFile(this FileInfo path)
        {
            return CompileFile(path.FullName);
        }

        public static CompileResult CompileFile(string path)
        {
            CompilationResult r = SassCompiler.CompileFile(path);
            return new CompileResult(r, File.ReadAllText(path));
        }
    }
}