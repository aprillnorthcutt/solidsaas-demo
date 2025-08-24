using Microsoft.Data.SqlClient;

public class InsecureRepo {
    public void GetUser(string username) {
        var conn = new SqlConnection("Server=...;Database=...;Trusted_Connection=True;");
        conn.Open();
        var cmd = new SqlCommand("SELECT * FROM Users WHERE Name = '" + username + "'", conn); // 💥 injection
        var reader = cmd.ExecuteReader();
    }
}
