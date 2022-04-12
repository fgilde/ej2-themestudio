using System;
using System.IO;
using System.IO.Compression;
using System.Threading.Tasks;
using ThemeStudio.Models;

namespace ThemeStudio.Extensions
{
    public static class CompileResultExtensions
    {
        public static CompileResult AddCompatibilityIf(this CompileResult result, ThemeProperties theme, string path)
        {
            theme.AddCompatibilityIf(path, result.InitialContent);
            return result;
        }

        public static CompileResult WriteTo(this CompileResult result, ThemeProperties theme, string path)
        {
            File.WriteAllText(Path.Combine(path, $"{theme.Theme}.css"), result.CompiledContent);
            File.WriteAllText(Path.Combine(path, $"{theme.Theme}.scss"), result.InitialContent);
            File.WriteAllText(Path.Combine(path, "settings.json"), theme.GetSettingsJson());
            return result;
        }

        public static Tuple<CompileResult, FileInfo> ZipTo(this CompileResult result, ThemeProperties theme, string zipFileName)
        {
            var directory = Directory.CreateDirectory(Path.Combine(Paths.Output, zipFileName)).FullName;
            result.WriteTo(theme, directory);

            var zipPath = Directory.CreateDirectory(Paths.OutputZip).FullName;
            var zipTarget = Path.Combine(zipPath, $"{zipFileName}.zip");

            ZipFile.CreateFromDirectory(directory, zipTarget);
            if (Directory.Exists(directory)) Directory.Delete(directory, true);

            return Tuple.Create(result, new FileInfo(zipTarget));
        }

        internal static Tuple<CompileResult, FileInfo> DeleteAfter(this Tuple<CompileResult, FileInfo> tuple, TimeSpan timeSpan)
        {
            Task.Run(async () =>
            {
                await Task.Delay(timeSpan);
                if (tuple.Item2.Exists)
                    tuple.Item2.Delete();
            });
            return tuple;
        }

        internal static string GetRoute(this Tuple<CompileResult, FileInfo> tuple)
        {
            return $"/output/zip/{tuple.Item2.Name}";
        }

    }
}