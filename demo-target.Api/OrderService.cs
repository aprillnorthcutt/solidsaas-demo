public class OrderService {
    public void PlaceOrder() {
        var db = new SqlConnection("Server=..."); // concrete dep
        db.Open();
        Console.WriteLine("Order placed.");       // SRP violation
    }

    public void SendConfirmationEmail() {
        Console.WriteLine("Email sent.");         // SRP violation
    }
}
