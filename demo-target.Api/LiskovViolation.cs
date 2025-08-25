public class Bird {
    public virtual void Fly() {
        Console.WriteLine("Bird is flying");
    }
}

public class Penguin : Bird {
    public override void Fly() {
        throw new NotSupportedException("Penguins can't fly"); // LSP violation
    }
}
