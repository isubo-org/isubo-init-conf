import path from 'path';
import { writeFileSync } from 'fs';
import prompts from 'prompts';
import { dump as yamlDump } from 'js-yaml';
import { CONF_TEMPLATE, HEADER } from './src/constant.js';

const enumInitialWayType = {
  SIMPLE: 'simple',
  FULL: 'full',
};

async function text({ message, initial, ...rest }) {
  const params = {
    type: 'text',
    name: 'value',
    message,
    ...rest,
  };
  if (initial) {
    params.initial = initial;
  }
  const { value } = await prompts(params);

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
    message: 'Enter your owner on GitHub'
  });

  conf.githubInfo.owner.value = value;
}

async function initRepo(conf) {
  const value = await text({
    message: 'Enter your repo on GitHub'
  });

  conf.githubInfo.repo.value = value;
}

async function initBranch(conf) {
  const { owner, repo, branch } = conf.githubInfo;
  const value = await text({
    message: `Enter your branch on ${owner.value}/${repo.value}`,
    initial: branch.value,
  });

  conf.githubInfo.branch.value = value;
}

async function initToken(conf) {
  const type = await select({
    message: 'Choose how to set token',
    choices: [
      {
        title: 'plaintext',
        value: 'plaintext',
      },
      {
        title: 'environment_variables',
        value: 'environment_variables',
      },
    ],
  });

  let token = '';
  switch (type) {
    case 'plaintext': {
      token = await text({
        message: 'Enter the value of the token',
      });
      break;
    }
    case 'environment_variables':
    default: {
      token = await text({
        message: 'Enter the name of the token, which will eventually be converted to uppercase.Such as GITHUB_TOKEN or github_token.',
      });

      token = `$${token.toUpperCase()}`;
    };
  }

  conf.githubInfo.token.value = token;
}

async function initSourceDir(conf) {
  const { source_dir } = conf.postSource;
  const value = await text({
    message: 'Set the directory where posts are stored',
    initial: source_dir.value,
  });

  conf.postSource.source_dir.value = value;
}

async function initLinkPrefix(conf) {
  const { owner, repo, branch } = conf.githubInfo;
  const { source_dir } = conf.postSource;
  const value = await text({
    message: '[link_prefix], used to format links in articles, and format relative links as url links',
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

  console.log(JSON.stringify(getConfSlim(conf), null, 2));

  writeConf(conf);
};
