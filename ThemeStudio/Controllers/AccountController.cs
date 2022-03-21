using System;
using System.Web.Mvc;
using ThemeStudio.Helper;

namespace ThemeStudio.Controllers
{
    public class AccountController : Controller
    {
        [HttpPost]
        public ActionResult Login(LoginModel model)
        {
            // TODO: Build real authentication and authorization
            if (model.Password == "admin" && model.UserName == "admin$MasterPassword")
            {
                return Json(Session.SetIsAuthenticated(true));
            }
            return new HttpUnauthorizedResult();
        }

        public ActionResult Logout()
        {
            Session.SetIsAuthenticated(false);
            return RedirectToAction("Index", "Home", new {theme = Request.QueryString.Get("theme")});
        }
    }

    public class LoginModel
    {
        public string UserName { get; set; }
        public string Password { get; set; }
    }
}