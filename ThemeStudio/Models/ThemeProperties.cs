using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ThemeStudio.Extensions;
using ThemeStudio.Helper;
using ThemeStudio.Helper.ScssHelper;

namespace ThemeStudio.Models
{
    public class ThemeProperties
    {
        private string[] _dependency;
        public string Theme { get; set; }
        public IDictionary<string, string> Properties { get; set; } = new Dictionary<string, string>();

        public string[] Dependency
        {
            get => _dependency ??= ReadDependencies();
            set => _dependency = value;
        }

        public string[] Components { get; set; }

        public string File { get; set; }
        public bool Compatibility { get; set; } 

        public bool IsDark => Theme != null && Theme.IndexOf('-') != -1;

        public string GetSettingsJson() => JsonConvert.SerializeObject(GetSettingsJObject());

        public JObject GetSettingsJObject()
        {
            dynamic settings = new JObject();
            settings.theme = Theme;
            settings["properties"] = JsonConvert.SerializeObject(Properties);
            settings["components"] = JsonConvert.SerializeObject(Components);
            return settings;
        }

        public string ToSassVarDeclaration() => Properties?.Any() == true ? string.Join($";{Environment.NewLine}", Properties.Select(p => $"{p.Key}:{p.Value}")) + ";" : string.Empty;

        public IEnumerable<string> GetBaseDependencyFiles()
        {
            if (Dependency.Contains("base"))
            {
                yield return Path.Combine(Paths.ResourceStyles, "base", "definition", $"{Theme}.scss");
                yield return Path.Combine(Paths.ResourceStyles, "base", $"{Theme}.scss");
            }
        }

        public IEnumerable<string> GetDependencyFiles()
            => GetBaseDependencyFiles().Concat(Dependency.Where(d => d != "base")
                .SelectMany(dep => Directory.GetFiles(Path.Combine(Paths.ResourceStyles, dep.SkipChars('/')), $"{Theme}.scss", SearchOption.AllDirectories)));
        
        public string GetDependenciesContent() => string.Join("", GetDependencyFiles().Where(System.IO.File.Exists).Select(System.IO.File.ReadAllText));

        public string GetScssContent() => GetDependenciesContent();

        public IEnumerable<ScssVariable> GetChangedScssVariables(IEnumerable<string> files = null)
        {
            return ThemeHelper.UpdateVariablesForTheme(this, files);
        }

        private string[] ReadDependencies()
        {
            var sources = Paths.GetAllScssFiles(Theme, Components).ToList();
            var dependencies = sources.Select(s => Path.GetDirectoryName(s.Replace(Paths.ResourceStyles, "")).TrimStart('\\').TrimEnd('\\').Replace("\\", "/")).ToArray();
            return dependencies;
        }

        public static ThemeProperties FromTheme(string themeName, string[] components = null)
        {
            var sources = Paths.GetAllScssFiles(themeName, components).ToList();
            var variables = ScssHelper.ReadEditableVariables(sources);
            var properties = variables.ToDictionary(v => v.Key, v => v.Value);

            return new ThemeProperties { Theme = themeName, Components = components, Properties = properties };
        }
    }
}