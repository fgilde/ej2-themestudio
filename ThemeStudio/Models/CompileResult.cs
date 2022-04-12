using LibSassHost;

namespace ThemeStudio.Models
{
    public class CompileResult
    {
        public CompileResult(CompilationResult result, string initialContent = "")
        {
            InitialContent = initialContent;
            Result = result;
            CompiledContent = result.CompiledContent;
        }

        public string CompiledContent { get; set; }
        public string InitialContent { get; set; }
        public CompilationResult Result { get; set; }

        public static implicit operator string(CompileResult d) => d.CompiledContent;
    }
}