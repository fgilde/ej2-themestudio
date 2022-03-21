using System;
using System.Net;
using System.Web.Mvc;
using System.Web.WebPages;
using ThemeStudio.Helper;

namespace ThemeStudio.Attributes
{
    public class SessionAuthorizeAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            if (!filterContext.HttpContext.Session.IsAuthenticated())
            {
                filterContext.HttpContext.Response.SetStatus(HttpStatusCode.Unauthorized);
                throw new UnauthorizedAccessException();
            }
            
        }
    }
}