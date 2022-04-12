using System;
using System.Net;
using ThemeStudio.Helper;

namespace ThemeStudio.Attributes
{
    public class SessionAuthorizeAttribute : Microsoft.AspNetCore.Mvc.Filters.ActionFilterAttribute
    {
        public override void OnActionExecuting(Microsoft.AspNetCore.Mvc.Filters.ActionExecutingContext filterContext)
        {
            if (!filterContext.HttpContext.Session.IsAuthenticated())
            {
                filterContext.HttpContext.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                throw new UnauthorizedAccessException();
            }
            
        }
    }
}