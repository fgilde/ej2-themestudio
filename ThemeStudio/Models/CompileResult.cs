using LibSass.Compiler;

namespace ThemeStudio.Models
{
    public class CompileResult
    {
        public CompileResult(SassResult result, string initialContent = "")
        {
            InitialContent = initialContent;
            Result = result;
            CompiledContent = result.Output;
        }

        public string CompiledContent { get; set; }
        public string InitialContent { get; set; }
        public SassResult Result { get; set; }
    }
}