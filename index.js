import path from 'path';
import chalk from 'chalk';
import { existsSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'fs';
import prompts from 'prompts';
import { dump as yamlDump } from 'js-yaml';
import { CONF_TEMPLATE, HEADER } from './src/constant.js';

const enumInitialWayType = {
  SIMPLE: 'simple',
  FULL: 'full',
};

const enumTokenSettingType = {
  PLAINTEXT: 'plaintext',
  ENVIRONMENT_VARIABLES: 'environment_variables'
};

let curTokenSettingType = enumTokenSettingType.ENVIRONMENT_VARIABLES;

function streamlog(text) {
  process.stderr.write(text + '\n');
}

function hinterWarn(text) {
  const prefix = chalk.bgGreenBright(chalk.black(' WARN '));
  streamlog(`${prefix} ${text}`);
}

function hinterError(text) {
  const prefix = chalk.bgGreenBright(chalk.black(' ERROR '));
  streamlog(`${prefix} ${chalk.redBright(text)}`);
}

async function text({ message, initial, ...rest }) {
  const params = {
    type: 'text',
    name: 'value',
    message,
    validate(value) {
      return !!value;
    },
    ...rest,
  };
  if (initial) {
    params.initial = initial;
  }
  const { value } = await prompts(params);

  if (!value) {
    process.exit(1);
  }

  return value;
}

async function select({ message, choices, ...rest }) {
  const { value } = await prompts({
    type: 'select',
    name: 'value',
    message,
    choices,
    ...rest,
  });

  if (!value) {
    process.exit(1);
  }

  return value;
}

// async function selectInitialWay() {
//   return select({
//     message: 'Pick a initial way',
//     choices: [
//       {
//         title: 'simple',
//         description: 'Only set necessary configuration items',
//         value: enumInitialWayType.SIMPLE,
//       },
//       {
//         title: 'full',
//         description: 'Set all configuration items',
//         value: enumInitialWayType.FULL,
//       },
//     ],
//   });
// }

async function initOwner(conf) {
  const value = await text({
    message: `Set your ${chalk.redBright('<owner>')} on GitHub`
  });

  conf.githubInfo.owner.value = value;
}

async function initRepo(conf) {
  const value = await text({
    message: `Set your ${chalk.redBright('<repo>')} on GitHub`
  });

  conf.githubInfo.repo.value = value;
}

async function initBranch(conf) {
  const { owner, repo, branch } = conf.githubInfo;
  const value = await text({
    message: `Set your ${chalk.yellowBright('[branch]')} on ${owner.value}/${repo.value}`,
    initial: branch.value,
  });

  conf.githubInfo.branch.value = value;
}

async function initToken(conf) {
  const type = await select({
    message: `Choose how to set ${chalk.redBright('<token>')}`,
    choices: [
      {
        title: 'plaintext - Not recommended because it is unsafe',
        value: enumTokenSettingType.PLAINTEXT,
      },
      {
        title: 'environment_variables (recommended) - Save in environment variables',
        value: enumTokenSettingType.ENVIRONMENT_VARIABLES,
      },
    ],
  });

  curTokenSettingType = type;

  let token = '';
  switch (type) {
    case enumTokenSettingType.PLAINTEXT: {
      token = await text({
        message: `Set the value of the ${chalk.redBright('<token>')}`,
      });
      break;
    }
    case enumTokenSettingType.ENVIRONMENT_VARIABLES:
    default: {
      token = await text({
        message: `Set the name of the ${chalk.redBright('<token>')}`,
        initial: 'GITHUB_TOKEN',
      });

      token = `$${token.toUpperCase()}`;
    };
  }

  conf.githubInfo.token.value = token;
}

async function initSourceDir(conf) {
  const { source_dir } = conf.postSource;
  const NEW_FOLDER = 'new folder';
  const selectExistedDir = async () => {
    const existedDirs = readdirSync('./');
    const choices = existedDirs
      .filter((s) => {
        if (s.startsWith('.')) {
          return false;
        }

        if (!statSync(s).isDirectory()) {
          return false;
        }

        return ![
          'bin',
          'scripts',
          'node_modules',
        ].includes(s);
      })
      .map((dirname) => {
        const lastDirname = path.join(dirname, './');
        return {
          title: lastDirname,
          value: lastDirname,
        };
      });
    choices.push({ title: NEW_FOLDER, value: NEW_FOLDER });
    return select({
      message: `Select a existed directory to store the posts, ${chalk.yellowBright('[source_dir]')}`,
      choices,
    });
  };

  const newFolder = async () => {
    const newFolderName = await text({
      message: `New a directory where posts are stored, ${chalk.yellowBright('[source_dir]')}`,
      initial: source_dir.value,
    });

    if (existsSync(newFolderName)) {
      hinterError(`[${newFolderName}] already existed!`);
      return newFolder();
    }

    try {
      mkdirSync(newFolderName); 
    } catch (error) {
      hinterError(error.message);
      return newFolder();
    }

    return newFolderName;
  };

  let value = await selectExistedDir();

  if (value === NEW_FOLDER) {
    value = await newFolder();
  }

  conf.postSource.source_dir.value = value;
}

async function initLinkPrefix(conf) {
  const { owner, repo, branch } = conf.githubInfo;
  const { source_dir } = conf.postSource;
  const value = await text({
    message: `Set the resource access link prefix, ${chalk.yellowBright('[link_prefix]')}`,
    initial: `https://raw.githubusercontent.com/${owner.value}/${repo.value}/${branch.value}/${path.join(source_dir.value, './')}`,
  });

  conf.linkFormat.link_prefix.value = value;
}


function getConfSlim(conf) {
  const ret = {};
  const confKeys = Object.keys(conf);

  const getConfIt = (confIt) => {
    const itRet = {};
    const keys = Object.keys(confIt);
    for (let idx = 0; idx < keys.length; idx += 1) {
      const key = keys[idx];
      if (key === 'name') {
        continue;
      }

      const it = confIt[key];
      itRet[key] = it.value;
    }

    return itRet;
  }

  for (let idx = 0; idx < confKeys.length; idx += 1) {
    const confKey = confKeys[idx];
    const confIt = conf[confKey];
    ret[confKey] = getConfIt(confIt);
  }

  return ret;
}

function writeConf(conf) {
  const lines = [`${HEADER}\n`];
  const writeChapter = (items) => {
    const chapterLines = [];
    const keys = Object.keys(items);
    for (let idx = 0; idx < keys.length; idx += 1) {
      const key = keys[idx];
      const it = items[key];

      if (key === 'name') {
        chapterLines.push(`# ${it}\n`);
        continue;
      }
      chapterLines.push(...[
        it.desc,
        yamlDump({ [key]: it.value })
      ]);
    }

    lines.push(`${chapterLines.join('\n')}\n`);
  };

  writeChapter(conf.githubInfo);
  writeChapter(conf.postSource);
  writeChapter(conf.linkFormat);
  writeChapter(conf.assetsPush);
  writeChapter(conf.enhance);

  const str = lines.join('\n');

  writeFileSync('isubo.conf.yml', str);
}

export const init = async () => {
  const conf = CONF_TEMPLATE;
  // const initialWay = await selectInitialWay();
  const initialWay = enumInitialWayType.SIMPLE;

  streamlog('For detailed instructions on the following settings, please refer to https://github.com/isaaxite/deploy-posts-to-github-issue/blob/main/MANUAL.md');
  switch (initialWay) {
    case enumInitialWayType.SIMPLE:
    default:
      await initOwner(conf);
      await initRepo(conf);
      await initBranch(conf);
      await initToken(conf);
      await initSourceDir(conf);
      await initLinkPrefix(conf);
  }

  streamlog(JSON.stringify(getConfSlim(conf), null, 2));

  if (curTokenSettingType === enumTokenSettingType.ENVIRONMENT_VARIABLES) {
    const tokenName = chalk.redBright(conf.githubInfo.token.value.slice(1));
    hinterWarn(`Please make sure you have set the environment variable named ${tokenName}.`);
  }

  writeConf(conf);
};
