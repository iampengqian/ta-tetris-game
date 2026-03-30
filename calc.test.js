import { add, multiply } from './calc.js';

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name} - PASSED`);
    } catch (e) {
        console.error(`❌ ${name} - FAILED: ${e.message}`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

test("add(1, 2) should be 3", () => {
    assert(add(1, 2) === 3, "1 + 2 should be 3");
});

test("add(-1, 1) should be 0", () => {
    assert(add(-1, 1) === 0, "-1 + 1 should be 0");
});

test("multiply(2, 3) should be 6", () => {
    assert(multiply(2, 3) === 6, "2 * 3 should be 6");
});

test("multiply(0, 5) should be 0", () => {
    assert(multiply(0, 5) === 0, "0 * 5 should be 0");
});
