/**
 * @license
 * Copyright 2024 Daymon Littrell-Reyes
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/// <reference types="@rbxts/testez/globals" />

import { Option } from "@rbxts/rust-classes";
import { HttpService } from "@rbxts/services";
import { deepEqual, resetDefaultDeepEqualConfig, setDefaultDeepEqualConfig } from ".";
import { FailureType } from "./types";

function encode(value: unknown): string {
  return HttpService.JSONEncode(value);
}

/**
 * @internal
 */
export = () => {
  beforeEach(() => {
    resetDefaultDeepEqualConfig();
  });

  describe("numbers", () => {
    it("should pass when equal", () => {
      const result = deepEqual(5, 5);
      expect(result).to.never.be.ok();
    });

    it("should fail when not equal", () => {
      const result = deepEqual(5, 4);
      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("DIFFERENT_VALUES");
      expect(result.leftValue).to.equal(5);
      expect(result.rightValue).to.equal(4);
    });

    it("should fail on equal strings", () => {
      const result = deepEqual(5, "5");
      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("DIFFERENT_TYPES");
      expect(result.leftValue).to.equal(5);
      expect(result.leftType).to.equal("number");
      expect(result.rightValue).to.equal("5");
      expect(result.rightType).to.equal("string");
    });
  });

  describe("arrays", () => {
    it("should pass when equal", () => {
      const result = deepEqual([1, 2, 3], [1, 2, 3]);
      expect(result).to.never.be.ok();
    });

    it("should fail when not equal", () => {
      const result = deepEqual([1, 2, 3], [1, 2, 4]);
      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("MISSING_ARRAY_VALUE");
      expect(encode(result.rightMissing)).to.equal("[3]");
      expect(encode(result.leftMissing)).to.equal("[4]");
    });

    it("should fail on right missing", () => {
      const result = deepEqual([1, 2, 3], [1, 2]);
      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("MISSING_ARRAY_VALUE");
      expect(encode(result.rightMissing)).to.equal("[3]");
      expect(result.leftMissing.isEmpty()).to.equal(true);
    });

    it("should fail on left missing", () => {
      const result = deepEqual([1, 2], [1, 2, 3]);
      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("MISSING_ARRAY_VALUE");
      expect(encode(result.leftMissing)).to.equal("[3]");
      expect(result.rightMissing.isEmpty()).to.equal(true);
    });

    it("should be fine with 2d arrays", () => {
      const result = deepEqual(
        [
          [1, 2, 3],
          [1, 2, 3],
          [1, 2],
        ],
        [[1, 2, 3], [1, 2, 3], [1]]
      );

      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("MISSING_ARRAY_VALUE");
      expect(encode(result.rightMissing)).to.equal("[[1,2]]");
      expect(encode(result.leftMissing)).to.equal("[[1]]");
    });

    it("should pass on two empty arrays", () => {
      const result = deepEqual([], []);
      expect(result).to.never.be.ok();
    });
  });

  describe("tables", () => {
    it("should pass when equal", () => {
      const result = deepEqual(
        {
          name: "daymon",
          age: 100,
        },
        {
          name: "daymon",
          age: 100,
        }
      );

      expect(result).to.never.be.ok();
    });

    it("should fail when not equal", () => {
      const result = deepEqual(
        {
          name: "daymon",
          age: 100,
        },
        {
          name: "daymon",
          age: 200,
        }
      );

      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("DIFFERENT_VALUES");
      expect(result.leftValue).to.equal(100);
      expect(result.rightValue).to.equal(200);
      expect(result.path).to.equal("age");
    });

    it("should be fine with circular references", () => {
      const left = {
        name: "daymon",
        self: {},
        age: 100,
      };
      const right = {
        name: "daymon",
        self: {},
        age: 200,
      };
      left.self = left;
      right.self = right;

      const result = deepEqual(left, right);

      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("DIFFERENT_VALUES");
      expect(result.leftValue).to.equal(100);
      expect(result.rightValue).to.equal(200);
      expect(result.path).to.equal("age");
    });

    it("should catch circular references that are not equal", () => {
      const left = {
        data: {
          nested: {
            name: "daymon",
            self: {},
            age: 100,
          },
        },
      };
      const right = {
        data: {
          nested: {
            name: "daymon",
            self: {},
            age: 200,
          },
        },
      };
      left.data.nested.self = left.data;
      right.data.nested.self = right.data.nested;

      const result = deepEqual(left, right);

      expect(result).to.be.ok();
      assert(result);

      warn(result);

      expect(FailureType[result.failType]).to.equal("MISSING");
      expect(result.leftValue).to.equal(undefined);
      expect(result.rightValue).to.equal(right.data.nested);
      expect(result.path).to.equal("data.nested.self.self");
    });

    it("should pass on equal nested types", () => {
      const result = deepEqual(
        {
          name: "daymon",
          age: 100,
          car: {
            name: "Civic",
          },
        },
        {
          name: "daymon",
          age: 100,
          car: {
            name: "Civic",
          },
        }
      );

      expect(result).to.never.be.ok();
    });

    it("should fail on unequal nested types", () => {
      const result = deepEqual(
        {
          name: "daymon",
          age: 100,
          car: {
            name: "Civic",
          },
        },
        {
          name: "daymon",
          age: 100,
          car: {
            name: "Tesla",
          },
        }
      );

      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("DIFFERENT_VALUES");
      expect(result.leftValue).to.equal("Civic");
      expect(result.rightValue).to.equal("Tesla");
      expect(result.path).to.equal("car.name");
    });

    it("should catch right side missing properties", () => {
      const result = deepEqual(
        {
          name: "daymon",
          age: 100,
          car: "Civic",
        },
        {
          name: "daymon",
          age: 100,
        }
      );

      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("MISSING");
      expect(result.leftValue).to.equal("Civic");
      expect(result.rightValue).to.equal(undefined);
      expect(result.path).to.equal("car");
    });

    it("should catch left side missing properties", () => {
      const result = deepEqual(
        {
          name: "daymon",
          age: 100,
        },
        {
          name: "daymon",
          age: 100,
          car: "Civic",
        }
      );

      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("MISSING");
      expect(result.rightValue).to.equal("Civic");
      expect(result.leftValue).to.equal(undefined);
      expect(result.path).to.equal("car");
    });
  });

  describe("roblox types", () => {
    it("should pass when by equal by value", () => {
      const result = deepEqual(new Vector3(1, 2, 3), new Vector3(1, 2, 3));
      expect(result).to.never.be.ok();
    });

    it("should fail when not equal by value", () => {
      const left = new Vector3(1, 2, 3);
      const right = new Vector3(1, 2, 4);

      const result = deepEqual(left, right);
      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("DIFFERENT_VALUES");
      expect(result.leftValue).to.equal(new Vector3(1, 2, 3));
      expect(result.rightValue).to.equal(new Vector3(1, 2, 4));
    });

    it("should pass when equal by reference", () => {
      const left = new Instance("Part");

      const result = deepEqual(left, left);
      expect(result).to.never.be.ok();
    });

    it("should fail when not equal by reference", () => {
      const left = new Instance("Part");
      const right = new Instance("Part");

      const result = deepEqual(left, right);
      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("DIFFERENT_REFERENCE");
      expect(result.leftValue).to.equal(left);
      expect(result.rightValue).to.equal(right);
    });
  });

  describe("enabled inOrder", () => {
    beforeEach(() => {
      setDefaultDeepEqualConfig({ inOrder: true });
    });

    it("should pass when equal", () => {
      const result = deepEqual([1, 2, 3], [1, 2, 3]);
      expect(result).to.never.be.ok();
    });

    it("should fail when not equal", () => {
      const result = deepEqual([1, 2, 3], [1, 2, 4]);
      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("DIFFERENT_VALUES");
      expect(result.leftValue).to.equal(3);
      expect(result.rightValue).to.equal(4);
    });
  });

  describe("disabled checkRightMissing", () => {
    beforeEach(() => {
      setDefaultDeepEqualConfig({ checkRightMissing: false });
    });

    describe("arrays", () => {
      it("should pass on right missing", () => {
        const result = deepEqual([1, 2, 3], [1, 2]);
        expect(result).to.never.be.ok();
      });

      it("should still fail on left missing", () => {
        const result = deepEqual([1, 2], [1, 2, 3]);
        expect(result).to.be.ok();
        assert(result);

        expect(FailureType[result.failType]).to.equal("MISSING_ARRAY_VALUE");
        expect(encode(result.leftMissing)).to.equal("[3]");
        expect(result.rightMissing.isEmpty()).to.equal(true);
      });
    });

    describe("tables", () => {
      it("should pass on right missing", () => {
        const result = deepEqual(
          {
            name: "daymon",
            age: 100,
            car: "Civic",
          },
          {
            name: "daymon",
            age: 100,
          }
        );

        expect(result).to.never.be.ok();
      });

      it("should still fail on left missing", () => {
        const result = deepEqual(
          {
            name: "daymon",
            age: 100,
          },
          {
            name: "daymon",
            age: 100,
            car: "Civic",
          }
        );

        expect(result).to.be.ok();
        assert(result);

        expect(FailureType[result.failType]).to.equal("MISSING");
        expect(result.rightValue).to.equal("Civic");
        expect(result.leftValue).to.equal(undefined);
        expect(result.path).to.equal("car");
      });

      it("should still fail on nested left missing", () => {
        const result = deepEqual(
          {
            child: {
              name: "daymon",
            },
            age: 100,
          },
          {
            name: "daymon",
          }
        );

        expect(result).to.be.ok();
        assert(result);

        expect(FailureType[result.failType]).to.equal("MISSING");
        expect(result.rightValue).to.equal("daymon");
        expect(result.leftValue).to.equal(undefined);
        expect(result.path).to.equal("name");
      });

      it("should still fail on different values", () => {
        const result = deepEqual(
          {
            name: "bryan",
            age: 100,
          },
          {
            name: "daymon",
          }
        );

        expect(result).to.be.ok();
        assert(result);

        expect(FailureType[result.failType]).to.equal("DIFFERENT_VALUES");
        expect(result.rightValue).to.equal("daymon");
        expect(result.leftValue).to.equal("bryan");
        expect(result.path).to.equal("name");
      });
    });
  });

  describe("ignore", () => {
    beforeEach(() => {
      setDefaultDeepEqualConfig({ ignore: ["Vector3"] });
    });

    it("should pass on ignored values", () => {
      const result = deepEqual(
        {
          name: "daymon",
          age: 100,
          position: new Vector3(1, 2, 3),
        },
        {
          name: "daymon",
          age: 100,
          position: new Vector3(1, 2, 4),
        }
      );

      expect(result).to.never.be.ok();
    });
  });

  describe("referenceOnly", () => {
    beforeEach(() => {
      setDefaultDeepEqualConfig({ referenceOnly: ["Vector3"] });
    });

    it("should fail on reference for value types", () => {
      const left = new Vector3(1, 2, 3);
      const right = new Vector3(1, 2, 4);

      const result = deepEqual(left, right);
      expect(result).to.be.ok();
      assert(result);

      expect(FailureType[result.failType]).to.equal("DIFFERENT_REFERENCE");
      expect(result.leftValue).to.equal(left);
      expect(result.rightValue).to.equal(right);
    });
  });

  describe("customCheckers", () => {
    beforeEach(() => {
      setDefaultDeepEqualConfig({
        customCheckers: {
          Vector3: (_, l, r) => Option.none(),
        },
      });
    });

    it("should call provided method", () => {
      const left = new Vector3(1, 2, 3);
      const right = new Vector3(1, 2, 4);

      const result = deepEqual(left, right);
      expect(result).to.never.be.ok();
    });
  });
};
