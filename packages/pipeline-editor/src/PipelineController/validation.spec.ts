/*
 * Copyright 2018-2020 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { checkCircularReferences } from "./validation";

const linkExamples = [
  // ╭───╮      ╭───╮
  // │ a │──l0─►│ b │
  // ╰───╯      ╰───╯
  //   ▲          │
  //   ╰────l1────╯
  {
    it: "should detect a simple cycle",
    given: [
      { id: "l0", srcNodeId: "a", trgNodeId: "b", type: "nodeLink" },
      { id: "l1", srcNodeId: "b", trgNodeId: "a", type: "nodeLink" }
    ],
    expected: ["l0", "l1"]
  },

  // ╭───╮      ╭───╮      ╭───╮
  // │ f │──c0─►│ a │──l0─►│ b │
  // ╰───╯      ╰───╯      ╰───╯
  //              ▲          │
  //             l4         l1
  //              │          ▼
  //            ╭───╮      ╭───╮      ╭───╮
  //            │ e │◄─l3──│ c │──l2─►│ d │
  //            ╰───╯      ╰───╯      ╰───╯
  //              ▲
  //             c1
  //              │
  //            ╭───╮
  //            │ g │
  //            ╰───╯
  {
    it: "should ignore comment links",
    given: [
      { id: "l0", srcNodeId: "a", trgNodeId: "b", type: "nodeLink" },
      { id: "l1", srcNodeId: "b", trgNodeId: "c", type: "nodeLink" },
      { id: "l2", srcNodeId: "c", trgNodeId: "d", type: "nodeLink" },
      { id: "l3", srcNodeId: "c", trgNodeId: "e", type: "nodeLink" },
      { id: "l4", srcNodeId: "e", trgNodeId: "a", type: "nodeLink" },
      { id: "c0", srcNodeId: "f", trgNodeId: "a", type: "commentLink" },
      { id: "c1", srcNodeId: "g", trgNodeId: "c", type: "commentLink" }
    ],
    expected: ["l0", "l1", "l3", "l4"]
  },

  //    ╭───╮       ╭───╮
  //  ╭─│ a │◄╮   ╭─│ c │◄╮
  //  │ ╰───╯ │   │ ╰───╯ │
  //  │       │   │       │
  // l0      l1  l2      l3
  //  │       │   │       │
  //  │ ╭───╮ │   │ ╭───╮ │
  //  ╰►│ b │─╯   ╰►│ d │─╯
  //    ╰───╯       ╰───╯
  {
    it: "should detect multiple simple cycles",
    given: [
      { id: "l0", srcNodeId: "a", trgNodeId: "b", type: "nodeLink" },
      { id: "l1", srcNodeId: "b", trgNodeId: "a", type: "nodeLink" },
      { id: "l2", srcNodeId: "c", trgNodeId: "d", type: "nodeLink" },
      { id: "l3", srcNodeId: "d", trgNodeId: "c", type: "nodeLink" }
    ],
    expected: ["l0", "l1", "l2", "l3"]
  },

  //   ╭────l4────╮
  //   ▼          │
  // ╭───╮      ╭───╮      ╭───╮
  // │ a │──l0─►│ b │    ╭─│ e │◄╮
  // ╰───╯      ╰───╯    │ ╰───╯ │
  //   │          ▲      │       │
  //  l2         l1     l5      l6
  //   ▼          │      │       │
  // ╭───╮      ╭───╮    │ ╭───╮ │
  // │ d │◄─l3──│ c │    ╰►│ f │─╯
  // ╰───╯      ╰───╯      ╰───╯
  {
    it: "should detect multiple cycles in a complex graph",
    given: [
      { id: "l0", srcNodeId: "a", trgNodeId: "b", type: "nodeLink" },
      { id: "l1", srcNodeId: "c", trgNodeId: "b", type: "nodeLink" },
      { id: "l2", srcNodeId: "a", trgNodeId: "d", type: "nodeLink" },
      { id: "l3", srcNodeId: "c", trgNodeId: "d", type: "nodeLink" },
      { id: "l4", srcNodeId: "b", trgNodeId: "a", type: "nodeLink" },
      { id: "l5", srcNodeId: "e", trgNodeId: "f", type: "nodeLink" },
      { id: "l6", srcNodeId: "f", trgNodeId: "e", type: "nodeLink" }
    ],
    expected: ["l0", "l4", "l5", "l6"]
  },

  // ╭───╮      ╭───╮      ╭───╮      ╭───╮
  // │ a │──l0─►│ b │◄─l1──│ c │    ╭─│ f │◄╮
  // ╰───╯      ╰───╯      ╰───╯    │ ╰───╯ │
  //              │          │      │       │
  //             l4         l3     l6      l7
  //              ▼          ▼      │       │
  //            ╭───╮      ╭───╮    │ ╭───╮ │
  //            │ d │◄─l5──│ e │    ╰►│ g │─╯
  //            ╰───╯      ╰───╯      ╰───╯
  //              │          ▲
  //              ╰────l2────╯
  {
    it: "should detect multiple cycles in a complex graph - shuffled",
    given: [
      { id: "l0", srcNodeId: "a", trgNodeId: "b", type: "nodeLink" },
      { id: "l1", srcNodeId: "c", trgNodeId: "b", type: "nodeLink" },
      { id: "l2", srcNodeId: "d", trgNodeId: "e", type: "nodeLink" },
      { id: "l3", srcNodeId: "c", trgNodeId: "e", type: "nodeLink" },
      { id: "l4", srcNodeId: "b", trgNodeId: "d", type: "nodeLink" },
      { id: "l5", srcNodeId: "e", trgNodeId: "d", type: "nodeLink" },
      { id: "l6", srcNodeId: "f", trgNodeId: "g", type: "nodeLink" },
      { id: "l7", srcNodeId: "g", trgNodeId: "f", type: "nodeLink" }
    ],
    expected: ["l2", "l5", "l6", "l7"]
  },

  // ╭───╮      ╭───╮      ╭───╮
  // │ a │──l0─►│ b │◄─l1──│ c │
  // ╰───╯      ╰───╯      ╰───╯
  //              │          ▲
  //              ╰────l2────╯
  {
    it: "should only detect links contributing to the cycle",
    given: [
      { id: "l0", srcNodeId: "a", trgNodeId: "b", type: "nodeLink" },
      { id: "l1", srcNodeId: "c", trgNodeId: "b", type: "nodeLink" },
      { id: "l2", srcNodeId: "b", trgNodeId: "c", type: "nodeLink" }
    ],
    expected: ["l1", "l2"]
  },

  // ╭───╮      ╭───╮      ╭───╮
  // │ a │──l0─►│ b │──l2─►│ c │
  // ╰───╯      ╰───╯      ╰───╯
  //   ▲         │ ▲         │
  //   ╰────l1───╯ ╰───l3────╯
  {
    it: "should detect joined cycles",
    given: [
      { id: "l0", srcNodeId: "a", trgNodeId: "b", type: "nodeLink" },
      { id: "l1", srcNodeId: "b", trgNodeId: "a", type: "nodeLink" },
      { id: "l2", srcNodeId: "b", trgNodeId: "c", type: "nodeLink" },
      { id: "l3", srcNodeId: "c", trgNodeId: "b", type: "nodeLink" }
    ],
    expected: ["l0", "l1", "l2", "l3"]
  },

  // ╭───╮      ╭───╮      ╭───╮
  // │ a │──l0─►│ b │──l2─►│ c │
  // ╰───╯      ╰───╯      ╰───╯
  //   ▲         │ ▲         │
  //   ╰────l1───╯ ╰───l3────╯
  {
    it: "should detect joined cycles - shuffled",
    given: [
      { id: "l3", srcNodeId: "c", trgNodeId: "b", type: "nodeLink" },
      { id: "l1", srcNodeId: "b", trgNodeId: "a", type: "nodeLink" },
      { id: "l2", srcNodeId: "b", trgNodeId: "c", type: "nodeLink" },
      { id: "l0", srcNodeId: "a", trgNodeId: "b", type: "nodeLink" }
    ],
    expected: ["l0", "l1", "l2", "l3"]
  },

  // ╭───╮      ╭───╮
  // │ a │──l0─►│ b │
  // ╰───╯      ╰───╯
  //   │          │
  //  l3         l1
  //   ▼          ▼
  // ╭───╮      ╭───╮
  // │ d │◄─l2──│ c │
  // ╰───╯      ╰───╯
  {
    it: "should not detect fake cycle",
    given: [
      { id: "l0", srcNodeId: "a", trgNodeId: "b", type: "nodeLink" },
      { id: "l1", srcNodeId: "b", trgNodeId: "c", type: "nodeLink" },
      { id: "l2", srcNodeId: "c", trgNodeId: "d", type: "nodeLink" },
      { id: "l3", srcNodeId: "a", trgNodeId: "d", type: "nodeLink" }
    ],
    expected: []
  },

  //   ╭────l4────╮
  //   ▼          │
  // ╭───╮      ╭───╮
  // │ a │──l0─►│ b │
  // ╰───╯      ╰───╯
  //   │          ▲
  //  l2         l1
  //   ▼          │
  // ╭───╮      ╭───╮
  // │ d │◄─l3──│ c │
  // ╰───╯      ╰───╯
  {
    it: "should detect cycle when a fork that gets checked first is safe",
    given: [
      { id: "l0", srcNodeId: "a", trgNodeId: "b", type: "nodeLink" },
      { id: "l1", srcNodeId: "c", trgNodeId: "b", type: "nodeLink" },
      { id: "l2", srcNodeId: "a", trgNodeId: "d", type: "nodeLink" },
      { id: "l3", srcNodeId: "c", trgNodeId: "d", type: "nodeLink" },
      { id: "l4", srcNodeId: "b", trgNodeId: "a", type: "nodeLink" }
    ],
    expected: ["l0", "l4"]
  },

  // ╭───╮      ╭───╮      ╭───╮      ╭───╮      ╭───╮
  // │ a │──l0─►│ b │──l1─►│ c │──l2─►│ d │──l3─►│ e │
  // ╰───╯      ╰───╯      ╰───╯      ╰───╯      ╰───╯
  //                         │
  //                        l4
  //                         ▼
  //                       ╭───╮      ╭───╮      ╭───╮      ╭───╮      ╭───╮
  //                       │ f │──l5─►│ g │──l6─►│ h │──l7─►│ i │──l8─►│ j │
  //                       ╰───╯      ╰───╯      ╰───╯      ╰───╯      ╰───╯
  //                                                          ▲          │
  //                                                          ╰────l9────╯
  {
    it: "should handle long forks",
    given: [
      { id: "l0", srcNodeId: "a", trgNodeId: "b", type: "nodeLink" },
      { id: "l1", srcNodeId: "b", trgNodeId: "c", type: "nodeLink" },
      { id: "l2", srcNodeId: "c", trgNodeId: "d", type: "nodeLink" },
      { id: "l3", srcNodeId: "d", trgNodeId: "e", type: "nodeLink" },
      { id: "l4", srcNodeId: "c", trgNodeId: "f", type: "nodeLink" },
      { id: "l5", srcNodeId: "f", trgNodeId: "g", type: "nodeLink" },
      { id: "l6", srcNodeId: "g", trgNodeId: "h", type: "nodeLink" },
      { id: "l7", srcNodeId: "h", trgNodeId: "i", type: "nodeLink" },
      { id: "l8", srcNodeId: "i", trgNodeId: "j", type: "nodeLink" },
      { id: "l9", srcNodeId: "j", trgNodeId: "i", type: "nodeLink" }
    ],
    expected: ["l8", "l9"]
  },

  // ╭───╮      ╭───╮      ╭───╮      ╭───╮      ╭───╮
  // │ a │──l0─►│ b │──l1─►│ c │──l8─►│ i │──l9─►│ j │
  // ╰───╯      ╰───╯      ╰───╯      ╰───╯      ╰───╯
  //                         │
  //                        l2
  //                         ▼
  //                       ╭───╮      ╭───╮      ╭───╮      ╭───╮      ╭───╮
  //                       │ d │──l3─►│ e │──l4─►│ f │──l5─►│ g │──l6─►│ h │
  //                       ╰───╯      ╰───╯      ╰───╯      ╰───╯      ╰───╯
  //                                                          ▲          │
  //                                                          ╰────l7────╯
  {
    it: "should handle long forks - shuffled",
    given: [
      { id: "l0", srcNodeId: "a", trgNodeId: "b", type: "nodeLink" },
      { id: "l1", srcNodeId: "b", trgNodeId: "c", type: "nodeLink" },
      { id: "l2", srcNodeId: "c", trgNodeId: "d", type: "nodeLink" },
      { id: "l3", srcNodeId: "d", trgNodeId: "e", type: "nodeLink" },
      { id: "l4", srcNodeId: "e", trgNodeId: "f", type: "nodeLink" },
      { id: "l5", srcNodeId: "f", trgNodeId: "g", type: "nodeLink" },
      { id: "l6", srcNodeId: "g", trgNodeId: "h", type: "nodeLink" },
      { id: "l7", srcNodeId: "h", trgNodeId: "g", type: "nodeLink" },
      { id: "l8", srcNodeId: "c", trgNodeId: "i", type: "nodeLink" },
      { id: "l9", srcNodeId: "i", trgNodeId: "j", type: "nodeLink" }
    ],
    expected: ["l6", "l7"]
  },

  // ╭───╮      ╭───╮      ╭───╮      ╭───╮      ╭───╮
  // │ a │──l0─►│ b │──l1─►│ c │──l5─►│ f │──l6─►│ g │
  // ╰───╯      ╰───╯      ╰───╯      ╰───╯      ╰───╯
  //                         │          ▲
  //                        l2          l4
  //                         ▼          │
  //                       ╭───╮      ╭───╮
  //                       │ d │──l3─►│ e │
  //                       ╰───╯      ╰───╯
  {
    it: "should not have a bug that a previous implementation had",
    given: [
      { id: "l0", srcNodeId: "a", trgNodeId: "b", type: "nodeLink" },
      { id: "l1", srcNodeId: "b", trgNodeId: "c", type: "nodeLink" },
      { id: "l2", srcNodeId: "c", trgNodeId: "d", type: "nodeLink" },
      { id: "l3", srcNodeId: "d", trgNodeId: "e", type: "nodeLink" },
      { id: "l4", srcNodeId: "e", trgNodeId: "f", type: "nodeLink" },
      { id: "l5", srcNodeId: "c", trgNodeId: "f", type: "nodeLink" },
      { id: "l6", srcNodeId: "f", trgNodeId: "g", type: "nodeLink" }
    ],
    expected: []
  }
];

describe("@elyra/pipeline-editor", () => {
  describe("checkCircularReferences", () => {
    for (const { it: should, given, expected } of linkExamples) {
      it(should, async () => {
        const actual = checkCircularReferences(given);
        expect(new Set(actual)).toEqual(new Set(expected));
      });
    }
  });
});

// new: 13 passed, 0 failed
//      ✓ should detect a simple cycle
//      ✓ should ignore comment links
//      ✓ should detect multiple simple cycles
//      ✓ should detect multiple cycles in a complex graph
//      ✓ should detect multiple cycles in a complex graph (shuffled)
//      ✓ should only detect links contributing to the cycle
//      ✓ should detect joined cycles
//      ✓ should detect joined cycles (shuffled)
//      ✓ should not detect fake cycle
//      ✓ should detect cycle when a fork that gets checked first is safe
//      ✓ should handle long forks
//      ✓ should handle long forks (shuffled)
//      ✓ should not have a bug that a previous implementation had

// old: 6 passed, 7 failed
//      ✓ should detect a simple cycle
//      ✕ should ignore comment links                                      - Maximum call stack size exceeded
//      ✓ should detect multiple simple cycles
//      ✕ should detect multiple cycles in a complex graph                 - Maximum call stack size exceeded
//      ✕ should detect multiple cycles in a complex graph (shuffled)      - Maximum call stack size exceeded
//      ✕ should only detect links contributing to the cycle               - Maximum call stack size exceeded
//      ✓ should detect joined cycles
//      ✓ should detect joined cycles (shuffled)
//      ✓ should not detect fake cycle
//      ✕ should detect cycle when a fork that gets checked first is safe  - Maximum call stack size exceeded
//      ✕ should handle long forks                                         - Maximum call stack size exceeded
//      ✕ should handle long forks (shuffled)                              - Maximum call stack size exceeded
//      ✓ should not have a bug that a previous implementation had
