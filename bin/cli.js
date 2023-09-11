#!/usr/bin/env node

import yargs from 'yargs';
import { init } from '../main.js';

yargs(process.argv.slice(2))
  .usage(
    `$0`,
    'xxx',
    () => {},
    async () => {
      await init();
    },
  )
  .parse();
