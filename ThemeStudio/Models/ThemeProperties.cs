using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace ThemeStudio.Models
{
    public class ThemeProperties
    {
        public string theme { get; set; }
        public IDictionary<string, string> properties { get; set; }

        public string[] dependency { get; set; }

        public string[] components { get; set; }

        public string file { get; set; }
        public string compatiblity { get; set; }

        public bool IsDark => theme.IndexOf('-') != -1;

        public string GetSettingsJson() => JsonConvert.SerializeObject(GetSettingsJObject());

        public JObject GetSettingsJObject()
        {
            dynamic settings = new JObject();
            settings.theme = theme;
            settings["properties"] = JsonConvert.SerializeObject(properties);
            settings["components"] = JsonConvert.SerializeObject(components);
            return settings;
        }

        public string ToSassVarDeclaration() => string.Join($";{Environment.NewLine}", properties.Select(p => $"{p.Key}:{p.Value}")) + ";";

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
    }
}