using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using LibSass.Compiler.Options;
using LibSass.Compiler;
using System.Collections;
using System.IO;
using Newtonsoft.Json;
using System.Text;
using System.IO.Compression;
using System.Web.ModelBinding;
//using System.Web.Script.Serialization;
using Newtonsoft.Json.Linq;

namespace ThemeStudio.Controllers
{
    public class HomeController : Controller
    {
        public class GZipOrDeflateAttribute : ActionFilterAttribute
        {
            public override void OnActionExecuting
                 (ActionExecutingContext filterContext)
            {
                string acceptencoding = filterContext.HttpContext.Request.Headers["Accept-Encoding"];
                if (!string.IsNullOrEmpty(acceptencoding))
                {
                    acceptencoding = acceptencoding.ToLower();
                    var response = filterContext.HttpContext.Response;
                    if (acceptencoding.Contains("gzip"))
                    {
                        response.AppendHeader("Content-Encoding", "gzip");
                        response.Filter = new GZipStream(response.Filter,
                                              CompressionMode.Compress);
                    }
                    else if (acceptencoding.Contains("deflate"))
                    {
                        response.AppendHeader("Content-Encoding", "deflate");
                        response.Filter = new DeflateStream(response.Filter,
                                          CompressionMode.Compress);
                    }
                }
            }
        }
        public class ThemeProperties
        {
            public string theme { get; set; }
            public IDictionary<string, string> properties { get; set; }

            public string[] dependency { get; set; }

            public string[] components { get; set; }

            public string file { get; set; }
            public string compatiblity { get; set; }
        }
        public static String GetTimestamp(DateTime value)
        {
            return value.ToString("yyyyMMddHHmmssffff");
        }
        [GZipOrDeflate]
        public string ThemeChange(ThemeProperties color)
        {
            var changes = "";
            var timeStamp = GetTimestamp(DateTime.Now);
            var keys = color.properties.Keys.ToArray();

            for (var i = 0; i < keys.Length; i++)
            {
                var value = color.properties[keys[i]];
                changes = changes + (keys[i] + ":" + value) + ";\n";
            }

            var theme = (color.GetType().GetProperty("theme").GetValue(color, null)).ToString();
            var basePath = AppDomain.CurrentDomain.BaseDirectory.ToString();
            var path = basePath + "ej2-resource/styles/";
            var templatepath = basePath + "template/";
            var templatefile = System.IO.File.ReadAllText(templatepath + theme + ".txt");
            templatefile = templatefile.Replace("{{:common}}", changes);
            var filecontent = "";
            filecontent += templatefile;
            filecontent += System.IO.File.ReadAllText(path + "/all" + theme + ".scss");
            var outputdir = basePath + "resource/styles/";
            var ScssFilePath = outputdir + timeStamp;
            Directory.CreateDirectory(ScssFilePath);
            var sourcepath = ScssFilePath + "/" + theme + ".scss";

            System.IO.File.WriteAllText(sourcepath, filecontent);

            var result = sasscompiler(sourcepath);

            //delete all existing files and directories.
            sourcepath = ScssFilePath + "/" + theme + ".css";
            System.IO.File.WriteAllText(sourcepath, result);
            if (Directory.Exists(outputdir))
            {
                Directory.Delete(outputdir, true);
            }

            return result;
        }

        public string export(ThemeProperties exporting)
        {
            var themeName = exporting.theme;

            var changes = "";
            var keys = exporting.properties.Keys.ToArray();
            for (var i = 0; i < keys.Length; i++)
            {
                var value = exporting.properties[keys[i]];
                changes = changes + (keys[i] + ":" + value) + ";\n";
            }

            var filecontents = "";
            var basePath = AppDomain.CurrentDomain.BaseDirectory.ToString();
            var path = basePath + "ej2-resource/styles/";
            var components = (exporting.GetType().GetProperty("components").GetValue(exporting, null));
            var componentsarray = (components as IEnumerable).Cast<object>().Select(x => x.ToString()).ToArray();

            /* json file content*/
            dynamic settings = new JObject();
            settings.theme = themeName;
            settings["properties"] = JsonConvert.SerializeObject(exporting.properties);
            settings["components"] = JsonConvert.SerializeObject(componentsarray);

            /* json file end */
            var foldername = exporting.file; // user declare download floder name

            //TODO exporting.dependency
            var deps = exporting.dependency;
            var templatepath = basePath + "template/";
            if (themeName.IndexOf('-') != -1)
            {
                var darkpath = templatepath + "dark/";
                var templatefile = System.IO.File.ReadAllText(darkpath + themeName + ".txt");
                templatefile = templatefile.Replace("{{:common}}", changes as string);
                filecontents = filecontents + templatefile;
                var paths = basePath + "ej2-resource/styles/";
                for (int i = 0; i < deps.Length; i++)
                {
                    if (deps[i] == "base")
                    {
                        paths = paths + deps[i] + "/" + themeName + ".scss";
                        filecontents += System.IO.File.ReadAllText(paths);
                    }
                    else
                    {
                        var searchfilename = themeName + ".scss";
                        var sourcedirectories = basePath + "ej2-resource/styles/" + deps[i] + "/";
                        var files = Directory.GetFiles(sourcedirectories, searchfilename, SearchOption.AllDirectories);
                        foreach (var file in files)
                        {
                            filecontents += System.IO.File.ReadAllText(file);
                        }
                    }
                }
            }
            else
            {
                var templatefile = System.IO.File.ReadAllText(templatepath + themeName + ".txt");
                templatefile = templatefile.Replace("{{:common}}", changes);
                filecontents += templatefile;
                
                /* read a sass file */
                for (int i = 0; i < deps.Length; i++)
                {
                    if (deps[i] == "base")
                    {
                        path = path + deps[i] + "/" + themeName + ".scss";
                        filecontents += System.IO.File.ReadAllText(path);
                    }
                    else
                    {
                        var searchfilename = themeName + ".scss";
                        var sourcedirectories = basePath + "ej2-resource/styles/" + deps[i] + "/";
                        var files = Directory.GetFiles(sourcedirectories, searchfilename, SearchOption.AllDirectories);
                        foreach (var file in files)
                        {
                            filecontents += System.IO.File.ReadAllText(file);
                        }
                    }
                }
            }

            var bytes = new byte[4];
            var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            uint random = BitConverter.ToUInt32(bytes, 0) % 100000000;
            var str = string.Format("{0:D8}", random);

            var timeStamp = GetTimestamp(DateTime.Now);
            var outputdir = basePath + "outputs/" + foldername + '-' + timeStamp + '-' + str + "/";
            Directory.CreateDirectory(outputdir);
            var sourcepath = outputdir + themeName + ".scss";
            System.IO.File.WriteAllText(sourcepath, filecontents);
            filecontents = ScssReader.ConvertScssVariablesToCssVars(sourcepath, true);

            var result = sasscompiler(sourcepath);
            
            /* compatibility css */
            var compatiblity = exporting.compatiblity;
            if (compatiblity == "True")
            {
                var compataibilitydir = basePath + "outputs/" + foldername + '-' + timeStamp + '-' + str + "/compatibility/";
                Directory.CreateDirectory(compataibilitydir);
                //filecontents = filecontents.Replace("#{&}", ".e-control");
                System.IO.File.WriteAllText(compataibilitydir + themeName + ".scss", "$css: '.e-css' !default;\n$imported-modules: () !default;\n .e-lib { \n @at-root {\n" + filecontents + "}\n& .e-js [class^='e-'], & .e-js [class*=' e-'] {\n  box-sizing: content-box;\n }\n}");
                sourcepath = compataibilitydir + themeName + ".scss";
                var comptibilityresult = sasscompiler(sourcepath);
                System.IO.File.WriteAllText(compataibilitydir + themeName + ".css", comptibilityresult);
            }

            /* creation zip file */
            var zipPath = basePath + "outputzip";
            var zipTarget = zipPath + "/" + foldername + '-' + timeStamp + '-' + str + ".zip";
            var outputzip = "outputzip/" + foldername + '-' + timeStamp + '-' + str + ".zip";
            System.IO.File.WriteAllText(outputdir + themeName + ".css", result);
            System.IO.File.WriteAllText(outputdir + themeName + ".scss", filecontents);
            var settingsJson = JsonConvert.SerializeObject(settings);
            System.IO.File.WriteAllText(outputdir + "settings.json", settingsJson);
            Directory.CreateDirectory(zipPath);
            ZipFile.CreateFromDirectory(outputdir, zipTarget);
            if (Directory.Exists(outputdir))
            {
                Directory.Delete(outputdir, true);
            }

            return outputzip;
        }

        /* sass to css covert */
        public string sasscompiler(string sourcepath)
        {
            var options = new SassOptions
            {
                InputPath = sourcepath
            };
            var sass = new SassCompiler(options);
            var result = sass.Compile();
            return result.Output;
        }

        [HttpGet]
        public string themeProperties([QueryString] string theme)
        {
            string basePath = AppDomain.CurrentDomain.BaseDirectory.ToString();
            var path = basePath + "ej2-resource/styles/";

            var l = Directory.EnumerateFiles(path, $"{theme}.scss", SearchOption.AllDirectories);
            var vars = ScssReader.ReadVariables(l).Where(v => v.Type == ScssVariableType.Color && v.Value.Length == 7).ToList();
            var palette = vars.Select(v => v.Value).Where(v => v.StartsWith("#")).Distinct().ToArray();
            var paletteStr = string.Join(",", palette.Select(s => $"\"{s}\""));

            var builder = new StringBuilder();
            builder.Append("{");
            for (var index = 0; index < vars.Count; index++)
            {
                var variable = vars[index];
                builder.Append("\"" + variable.Name.Replace("Color", "") + "\" :{");
                builder.Append("\"id\": \"" + variable.Key.Replace("$", "") + "\",");
                builder.Append("\"default\": \"" + variable.Value + "\",");
                builder.Append("\"palettes\": [" + paletteStr + "]");
                builder.Append("}");
                if (index < vars.Count - 1)
                {
                    builder.Append(",");
                }
            }

            builder.Append("}");
            var jsonStr = builder.ToString();
            return jsonStr;
        }

        [GZipOrDeflate]
        public string loadtheme(ThemeProperties themes)
        {
            string theme = (themes.GetType().GetProperty("theme").GetValue(themes, null)) as string;

            string basePath = System.AppDomain.CurrentDomain.BaseDirectory.ToString();
            var path = basePath + "Content/ej2/" + theme + ".css";
            return System.IO.File.ReadAllText(path);
        }

        public string dark(ThemeProperties themes)
        {
            var theme = (themes.GetType().GetProperty("theme").GetValue(themes, null)).ToString();
            var basePath = AppDomain.CurrentDomain.BaseDirectory.ToString();
            var path = basePath + "ej2-resource/styles/";
            var depen = (themes.GetType().GetProperty("dependency").GetValue(themes, null));
            var deps = (depen as IEnumerable).Cast<object>().Select(x => x.ToString()).ToArray();
            var filecontents = "";
            /* read a sass file */
            for (int i = 0; i < deps.Length; i++)
            {
                if (deps[i] == "base")
                {
                    path += $"{deps[i]}/definition/{theme}.scss";
                    filecontents += System.IO.File.ReadAllText(path);
                    path = $"{basePath}ej2-resource/styles/";
                    path += $"{deps[i]}/{theme}.scss";
                    filecontents += System.IO.File.ReadAllText(path);
                }
                else
                {
                    var searchfilename = theme + ".scss";
                    var sourcedirectories = basePath + "ej2-resource/styles/" + deps[i] + "/";
                    var files = Directory.GetFiles(sourcedirectories, searchfilename, SearchOption.AllDirectories);
                    foreach (var file in files)
                    {
                        filecontents += System.IO.File.ReadAllText(file);
                    }
                }
            }
            var outputdir = basePath + "resource/styles/";

            Directory.CreateDirectory(outputdir);
            var sourcepath = outputdir + theme + ".scss";

            System.IO.File.WriteAllText(sourcepath, filecontents);

            var options = new SassOptions
            {
                InputPath = sourcepath
            };
            var sass = new SassCompiler(options);
            var result = sass.Compile();
            return result.Output;
        }
        public string DarkThemeChange(ThemeProperties color)
        {
            var sourcepath = "";
            var changes = "";
            var propertieskey = (color.properties.Keys);
            var keys = (propertieskey as IEnumerable).Cast<object>().Select(x => x.ToString()).ToArray();
            for (var i = 0; i < keys.Length; i++)
            {
                var value = color.properties[keys[i]];
                changes = changes + (keys[i] + ":" + value) + ";\n";
            }

            var theme = (color.GetType().GetProperty("theme").GetValue(color, null)) as string;
            var basePath = System.AppDomain.CurrentDomain.BaseDirectory.ToString();
            var depen = (color.GetType().GetProperty("dependency").GetValue(color, null));
            var deps = (depen as IEnumerable).Cast<object>().Select(x => x.ToString()).ToArray();
            var path = basePath + "ej2-resource/styles/";
            var templatepath = basePath + "template/dark/";
            var templatefile = System.IO.File.ReadAllText(templatepath + theme + ".txt");
            templatefile = templatefile.Replace("{{:common}}", changes as string);
            var filecontent = "";
            filecontent += templatefile;
            for (int i = 0; i < deps.Length; i++)
            {
                if (deps[i] == "base")
                {
                    path = $"{basePath}ej2-resource/styles/";
                    path = $"{path}{deps[i]}/{theme}.scss";
                    filecontent += System.IO.File.ReadAllText(path);
                }
                else
                {
                    var searchfilename = theme + ".scss";
                    var sourcedirectories = basePath + "ej2-resource/styles/" + deps[i] + "/";
                    var files = Directory.GetFiles(sourcedirectories, searchfilename, SearchOption.AllDirectories);
                    foreach (var file in files)
                    {
                        filecontent = filecontent + System.IO.File.ReadAllText(file);
                    }
                }
            }
            var outputdir = basePath + "resource/styles/";
            var ScssFilePath = outputdir;
            Directory.CreateDirectory(ScssFilePath);
            sourcepath = ScssFilePath + "/" + theme + ".scss";

            System.IO.File.WriteAllText(sourcepath, filecontent);

            var result = sasscompiler(sourcepath);

            //delete all existing files and directories.
            sourcepath = ScssFilePath + "/" + theme + ".css";
            System.IO.File.WriteAllText(sourcepath, result);
            if (Directory.Exists(outputdir))
            {
                Directory.Delete(outputdir, true);
            }

            return result;
        }

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}