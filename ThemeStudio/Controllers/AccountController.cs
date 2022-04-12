using System;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using ThemeStudio.Helper;
using ThemeStudio.Models;

namespace ThemeStudio.Controllers
{
    public class AccountController : Microsoft.AspNetCore.Mvc.Controller
    {
        private readonly IConfiguration _configuration;

        public AccountController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [Authorize]
        [HttpGet("/login")]
        public ActionResult Login()
        {
            HttpContext.Session.SetIsAuthenticated(true);
            HttpContext.Session.SetString(Constants.SessionNameKey, HttpContext.User.Identity?.Name ?? "Unknown");
            Request.Query.TryGetValue("theme", out var theme);
            return RedirectToAction("Index", "Home", new { theme });
        }

        [HttpPost]
        public ActionResult Login([FromBody]LoginModel model)
        {
            var accounts = _configuration.GetSection("Authentication:Internal:Accounts").Get<LoginModel[]>();
            //if (model.UserName == "admin" && model.Password == "S3rv1cew@rePassword4Designer")
            if(accounts.Any(m => m.Equals(model)))
            {
                HttpContext.Session.SetString(Constants.SessionNameKey, model.UserName);
                return Json(HttpContext.Session.SetIsAuthenticated(true));
            }
            return new UnauthorizedResult();
        }

        public ActionResult Logout()
        {
            Request.Query.TryGetValue("theme", out var theme);
            HttpContext.Session.SetIsAuthenticated(false);
            HttpContext.Session.SetString(Constants.SessionNameKey, string.Empty);
            return RedirectToAction("Index", "Home", new { theme });
        }
    }
}