bring cloud;

let b = new cloud.Bucket();

test "call extern code" {
  b.get("invalid-key");
}