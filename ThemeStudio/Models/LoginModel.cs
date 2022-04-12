using System;

namespace ThemeStudio.Models;

public class LoginModel : IEquatable<LoginModel>
{
    public bool Equals(LoginModel other)
    {
        if (ReferenceEquals(null, other)) return false;
        if (ReferenceEquals(this, other)) return true;
        return UserName == other.UserName && Password == other.Password;
    }

    public override bool Equals(object obj)
    {
        if (ReferenceEquals(null, obj)) return false;
        if (ReferenceEquals(this, obj)) return true;
        if (obj.GetType() != this.GetType()) return false;
        return Equals((LoginModel)obj);
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(UserName, Password);
    }

    public static bool operator ==(LoginModel left, LoginModel right)
    {
        return Equals(left, right);
    }

    public static bool operator !=(LoginModel left, LoginModel right)
    {
        return !Equals(left, right);
    }

    public string UserName { get; set; }
    public string Password { get; set; }
}