/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

'use strict';

const path = require('path');
const {extractSummary, cleanup, writeFiles} = require('../Utils');
const runJest = require('../runJest');
const ConditionalTest = require('../../scripts/ConditionalTest');

/**
 * NOTE: This test should be removed once jest-circus is rolled out as a breaking change.
 */

const DIR = path.resolve(__dirname, '../timeouts-legacy');

ConditionalTest.skipSuiteOnJestCircus();

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('exceeds the timeout set using jasmine.DEFAULT_TIMEOUT_INTERVAL', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 20;

      test('banana', () => {
        return new Promise(resolve => {
          setTimeout(resolve, 100);
        });
      });
    `,
    'package.json': '{}',
  });

  const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  expect(rest).toMatch(
    /(jest\.setTimeout|jasmine\.DEFAULT_TIMEOUT_INTERVAL|Exceeded timeout)/,
  );
  expect(summary).toMatchSnapshot();
  expect(status).toBe(1);
});

test('does not exceed the timeout using jasmine.DEFAULT_TIMEOUT_INTERVAL', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;

      test('banana', () => {
        return new Promise(resolve => {
          setTimeout(resolve, 20);
        });
      });
    `,
    'package.json': '{}',
  });

  const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false']);
  const {rest, summary} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(status).toBe(0);
});

test('can read and write jasmine.DEFAULT_TIMEOUT_INTERVAL', () => {
  writeFiles(DIR, {
    '__tests__/a-banana.js': `
      const timeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 154;
      const newTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

      test('banana', () => {
        expect(timeout).toBe(5000);
        expect(newTimeout).toBe(154);
      });
    `,
    'package.json': '{}',
  });

  const {stderr, status} = runJest(DIR, ['-w=1', '--ci=false']);
  const {summary} = extractSummary(stderr);
  expect(summary).toMatchSnapshot();
  expect(status).toBe(0);
});
