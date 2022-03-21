using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ThemeStudio.Helper;
using ThemeStudio.Helper.ScssHelper;

namespace ThemeStudio.Models
{
    public class ThemeProperties
    {
        public string theme { get; set; }
        public IDictionary<string, string> properties { get; set; } = new Dictionary<string, string>();

        public string[] dependency { get; set; }

        public string[] components { get; set; }

        public string file { get; set; }
        public string compatiblity { get; set; }

        public bool IsDark => theme != null && theme.IndexOf('-') != -1;

        public string GetSettingsJson() => JsonConvert.SerializeObject(GetSettingsJObject());

        public JObject GetSettingsJObject()
        {
            dynamic settings = new JObject();
            settings.theme = theme;
            settings["properties"] = JsonConvert.SerializeObject(properties);
            settings["components"] = JsonConvert.SerializeObject(components);
            return settings;
        }

        public string ToSassVarDeclaration() => properties?.Any() == true ? string.Join($";{Environment.NewLine}", properties.Select(p => $"{p.Key}:{p.Value}")) + ";" : string.Empty;

        public IEnumerable<string> GetBaseDependencyFiles()
        {
            if (dependency.Contains("base"))
            {
                yield return Path.Combine(Paths.ResourceStyles, "base", "definition", $"{theme}.scss");
                yield return Path.Combine(Paths.ResourceStyles, "base", $"{theme}.scss");
            }
        }

        public IEnumerable<string> GetDependencyFiles() 
            => GetBaseDependencyFiles().Concat(dependency.Where(d => d != "base").SelectMany(dep => Directory.GetFiles(Path.Combine(Paths.ResourceStyles, dep), $"{theme}.scss", SearchOption.AllDirectories)));

        public string GetDependenciesContent() => string.Join("", GetDependencyFiles().Where(File.Exists).Select(File.ReadAllText));

        public string GetScssContent(bool forceDependencyContent) => forceDependencyContent || IsDark ? GetDependenciesContent() : Paths.ReadScssContent(theme);

        public IEnumerable<ScssVariable> GetChangedScssVariables(IEnumerable<string> files = null)
        {
            return ThemeHelper.UpdateVariablesForTheme(this, files);
        }

        public static ThemeProperties FromTheme(string themeName)
        {
            var scssFiles = Paths.GetAllScssFiles(themeName).ToList();
            var variables = ScssHelper.ReadColorVariables(scssFiles);
            var properties = variables.ToDictionary(v => v.Key, v => v.Value);

            var dependencies = scssFiles.Select(s => Path.GetDirectoryName(s.Replace(Paths.ResourceStyles, "")).TrimStart('\\').TrimEnd('\\').Replace("\\", "/")).ToArray();
            return new ThemeProperties { theme = themeName, dependency = dependencies, properties = properties };
        }
    }
}