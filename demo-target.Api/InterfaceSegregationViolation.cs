public interface IMultiFunctionDevice {
    void Print();
    void Scan();
    void Fax();
}

public class SimplePrinter : IMultiFunctionDevice {
    public void Print() {
        Console.WriteLine("Printing");
    }

    public void Scan() {
        throw new NotImplementedException(); // ISP violation
    }

    public void Fax() {
        throw new NotImplementedException(); // ISP violation
    }
}
