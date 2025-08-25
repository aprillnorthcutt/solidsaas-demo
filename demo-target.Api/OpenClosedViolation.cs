public class ShapeAreaCalculator {
    public double CalculateArea(object shape) {
        if (shape is Circle circle) {
            return Math.PI * circle.Radius * circle.Radius;
        } else if (shape is Rectangle rectangle) {
            return rectangle.Width * rectangle.Height;
        } else if (shape is Triangle triangle) {
            return 0.5 * triangle.Base * triangle.Height;
        }

        throw new ArgumentException("Unknown shape");
    }
}

// OCP violation: adding new shapes requires modifying this class

public class Circle {
    public double Radius { get; set; }
}

public class Rectangle {
    public double Width { get; set; }
    public double Height { get; set; }
}

public class Triangle {
    public double Base { get; set; }
    public double Height { get; set; }
}
