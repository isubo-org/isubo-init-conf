import { formatDesc } from './util.js';

export const HEADER = `# Isubo Configuration
## Docs: https://github.com/isaaxite/deploy-posts-to-github-issue/blob/main/README.md
## Source: https://github.com/isaaxite/deploy-posts-to-github-issue`;

const owner = {
  desc: `
## [required]
## Repository owner, Such as "isaaxite" in "isaaxite/blog".
# e.g.
# owner: isaaxite
  `,
  value: ''
};

const repo = {
  desc: `
## [required]
## Repository name, refer to "blog" in the example above.
### Please ensure that this repository has been manually created by you, 
### it will be used to store posts resources, and posts will also be published to this repository's issue.
# e.g.
# repo: blog
  `,
  value: ''
};

const DEF_MAIN = 'main';
const branch = {
  desc: `
## [optional]
## Branch of <owner>/<repo>, the branch where the resource is actually stored.
## Default 'main'
## branch: main
  `,
  value: DEF_MAIN
};

const token = {
  desc: `
## [required]
## Github Token, it will be used to invoked github api to publish posts
## you can get it in https://github.com/settings/tokens
## It is strongly recommended not to use plaintext to prevent others from stealing your token. 
## You can try to use environment variables.
## If you use an environment variable, please start with $ and use uppercase letters for the remaining part to declare, 
## and isubo will automatically obtain this environment variable
# e.g.
# token: $GITHUB_TOKEN
  `,
  value: ''
};

const githubInfo = {
  name: 'Github Info',
  ...formatDesc({
    owner,
    repo,
    branch,
    token,
  }),
};

const source_dir = {
  desc: `
## [optional]
## Source dir, The top-level directory where articles are stored, and where isubo should looking for.
## Default "source/"
## e.g.
## source_dir: "source/"
  `,
  value: 'source/',
}

const postSource = {
  name: 'Post Source',
  ...formatDesc({
    source_dir
  }),
};

const link_prefix = {
  desc: `
## [optional]
## Used to format links in articles, and format relative links as url links
## it can take a string or plain object, as the blew example
##
## string: 
##  link_prefix: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<source_dir>/
##
## object:
##  link_prefix:
##    owner: <owner>, default is global owner
##    repo: <repo>, default is global repo
##    branch: <branch>, default is global branch
##    dir: '<dir>', default is global source_dir
##
## Default:
##  link_prefix: https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<source_dir>/
  `,
  value: ''
};

const types = {
  desc: `
## [optional]
## types, Which link type should be formated.
## According to the type specified by types, format the corresponding non-http path.
## Currently supports two formats of "image" and "link", the default is only "image" format.
# types: 
#   - image
  `,
  value: ['image']
};

const linkFormat = {
  name: 'Link Format',
  ...formatDesc({
    link_prefix,
    types,
  }),
};

const push_asset = {
  desc: `
## [optional]
## Setting this configuration that will detect link assets of those posts and judge which assets need to push when you published the posts.
## If there are some assets need to push and this configuration'value is 'prompt' or 'auto', isubo will use git-lib to push them.
## Hint: You can use this feature with confidence, because we will temporary storage those changes other than assets, 
## and recover them after pushed assets successfuly, in case we also set up a temporary branch as the last resort. 
##
## push_asset: prompt | auto | disable
##   prompt: prompt to if push assets
##   auto: push assets automatically
##   disable: just disable pushing assets
## Default setting is 'prompt'. 
  `,
  value: 'prompt',
};

const hide_frontmatter = {
  desc: `
## [optional]
## In Isubo, the post support yml metadata like the below. By default, the published issue will delete this part of metadata.
## If you want to show that, you should set 'hide_frontmatter: false'.
## Default: true  
  `,
  value: true,
};

const post_title_seat = {
  desc: `
## [optional]
## Isubo use directory name or filename at post path as post title
## By default, filename is used as the title of the post
## You can set it with 'post_title_seat'
## e.g.
## /home/issue-blog/source/license.md
## 0: license
## 1: source
## 2: isubo-blog  
  `,
  value: 0,
};

const assetsPush = {
  name: 'Assets Push',
  ...formatDesc({
    push_asset,
    hide_frontmatter,
    post_title_seat,
  }),
};

const source_statement = {
  desc: `
## [optional]
## Inserting a statement at the top of the post.
## By default, it is disable. If you want to use it, you can refer to the following example: 
# source_statement:
#  enable: [boolean], default=false
#  content: Array<string>, a list of string, default=[]
  `,
  value: {
    enable: false,
    content: []
  },
};

const back2top = {
  desc: `
## [optional]
## Insert a "back-to-top" button at the bottom of a paragraph.
## back2top:
##  enable: [boolean], default=true
##  text: [string], text of 'back-to-top' buttion, default='⬆ back to top'
##  link: [string], link of the buttion, default='#'
##  insert_deep: [number], the max inserting depth of paragraph(#=1,##=2), default=3
# back2top:
#   enable: true
#   text: ⬆ back to top
#   link: '#'
#   insert_deep: 3
  `,
  value: {
    enable: true,
    text: '⬆ back to top',
    link: '#',
    insert_deep: 3,
  }
};

const toc = {
  desc: `
## [optional]
## Insert table-of-content based on the content at the top of the post.
## toc:
##  enable: [boolean], default=true
##  title: [string], text of table-of-content, default='Table Of Content'
##  depth: [number], the maximum depth of generated toc, default=3
##  bullets: [string], the flag of list item, '-' | '*', default='-'
# toc:
#   enable: true
#   title: Table Of Content
#   depth: 3
#   bullets: '-'
  `,
  value: {
    enable: true,
    title: 'Table Of Content',
    depth: 3,
    bullets: '-',
  }
};

const enhance = {
  name: 'Enhance',
  ...formatDesc({
    source_statement,
    back2top,
    toc,
  }),
};

export const CONF_TEMPLATE = {
  githubInfo,
  postSource,
  linkFormat,
  assetsPush,
  enhance,
};
