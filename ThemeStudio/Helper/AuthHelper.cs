using System.Web;
using Microsoft.AspNetCore.Http;

namespace ThemeStudio.Helper
{
    public static class AuthHelper
    {
        public static bool IsAuthenticated(this ISession session)
        {
            return IsTrue(session, Constants.SessionAuthKey);
        }

        public static bool IsTrue(this ISession session, string key)
        {
            var r = session.GetString(key);
            return !string.IsNullOrEmpty(r) && bool.Parse(r);
        }

        public static bool SetIsAuthenticated(this ISession session, bool isAuthenticated)
        {
            session.SetString(Constants.SessionAuthKey, isAuthenticated.ToString());
            return isAuthenticated;
        }
    }
}