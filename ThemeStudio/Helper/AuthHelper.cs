using System.Web;

namespace ThemeStudio.Helper
{
    public static class AuthHelper
    {
        public static bool IsAuthenticated(this HttpSessionStateBase session)
        {
            return IsTrue(session, Constants.SessionAuthKey);
        }

        public static bool IsTrue(this HttpSessionStateBase session, string key)
        {
            return session[key] as bool? ?? false;
        }

        public static bool SetIsAuthenticated(this HttpSessionStateBase session, bool isAuthenticated)
        {
            session[Constants.SessionAuthKey] = isAuthenticated;
            return isAuthenticated;
        }
    }
}