using System.Web;
using System.Web.Optimization;

namespace ThemeStudio
{
    public class BundleConfig
    {
        // For more information on bundling, visit https://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-{version}.js"));
            
            bundles.Add(new ScriptBundle("~/bundles/themestudio").Include(
                      "~/Scripts/datasource.js",
                       "~/Scripts/combine.js",
                       "~/Scripts/VirtualList.js",
                       "~/Scripts/ColorHelper.js",
                       "~/Scripts/ScssVariableType.js",
                      "~/Scripts/index.js"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                      "~/Content/bootstrap.min.css",
                      "~/Content/site.css"));
        }
    }
}
