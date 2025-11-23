export class Vect3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    copy({ x, y, z }) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    setFromRotArray(quat) {
        const [x, y, z, w] = quat;

        // Standard formula for rotating the forward vector (0, 0, -1) by quaternion
        this.x = 2 * (x * z + w * y);
        this.y = 2 * (y * z - w * x);
        this.z = 1 - 2 * (x * x + y * y);

        // Optional: normalize
        const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        if (len > 0) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }

        return this;
    }
}