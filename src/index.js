import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import minimist from "minimist";
import prompts from "prompts";
import { blue, cyan, lightCyan, green, lightBlue, lightGreen, lightRed, magenta, red, reset, yellow } from 'kolorist';
// import mustache from 'mustache';

const argv = minimist(process.argv.slice(2), { string: ['_'] });
const cwd = process.cwd();

const FRAMEWORKS = [
  {
    name: 'vue-ts',
    display: 'TypeScript',
    color: blue,
  },
  {
    name: 'vue',
    display: 'JavaScript',
    color: yellow,
  },
];

// 模板名数组
const TEMPLATES = FRAMEWORKS.map((f) => f.name);
// 需要更名的文件名
const renameFiles = {
  _gitignore: '.gitignore',
};
// 默认项目名
const defaultTargetDir = 'vv-project';

async function init() {
  const argTargetDir = formatTargetDir(argv._[0]);
  const argTemplate = argv.template || argv.t;
  let targetDir = argTargetDir || defaultTargetDir;
  const getProjectName = () => targetDir === '.' ? path.basename(path.resolve()) : targetDir;
  let result;
  try {
    result = await prompts([
        {
            type: argTargetDir ? null : 'text',
            name: 'projectName',
            message: reset('Project name:'),
            initial: defaultTargetDir,
            onState: (state) => {
                targetDir = formatTargetDir(state.value) || defaultTargetDir;
            },
        },
        {
            type: () => !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm',
            name: 'overwrite',
            message: () => (targetDir === '.'
                ? 'Current directory'
                : `Target directory "${targetDir}"`) +
                ` is not empty. Remove existing files and continue?`,
        },
        {
            type: (_, { overwrite }) => {
                if (overwrite === false) {
                    throw new Error(red('✖') + ' Operation cancelled');
                }
                return null;
            },
            name: 'overwriteChecker',
        },
        {
            type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
            name: 'packageName',
            message: reset('Package name:'),
            initial: () => toValidPackageName(getProjectName()),
            validate: (dir) => isValidPackageName(dir) || 'Invalid package.json name',
        },
        {
            type: argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
            name: 'framework',
            message: typeof argTemplate === 'string' && !TEMPLATES.includes(argTemplate)
                ? reset(`"${argTemplate}" isn't a valid template. Please choose from below: `)
                : reset('Select a framework:'),
            initial: 0,
            choices: FRAMEWORKS.map((framework) => {
                const frameworkColor = framework.color;
                return {
                    title: frameworkColor(framework.display || framework.name),
                    value: framework,
                };
            }),
        },
        {
          type: () => 'confirm',
          name: 'versionCheck',
          message: 'Do you need version detection function?',
        },
        {
            type: (framework) => framework && framework.variants ? 'select' : null,
            name: 'variant',
            message: reset('Select a variant:'),
            choices: (framework) => framework.variants.map((variant) => {
                const variantColor = variant.color;
                return {
                    title: variantColor(variant.display || variant.name),
                    value: variant.name,
                };
            }),
        },
    ], {
        onCancel: () => {
            throw new Error(red('✖') + ' Operation cancelled');
        },
    });
  }
  catch (cancelled) {
    console.log(cancelled.message);
    return;
  }

  // 提取用户指令
  const { framework, overwrite, packageName, variant } = result;
  // 项目生成路径
  const root = path.join(cwd, targetDir);

  // 1) 用户同意重写则清空文件夹
  // 2) 否则根据用户输入包名创建文件夹
  if (overwrite) {
    emptyDir(root);
  }
  else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  console.log(`\nScaffolding project in ${root}...`);

  const templateDir = path.resolve(fileURLToPath(import.meta.url), '../..', `template-vue`);
  const write = (file, content) => {
    const targetPath = path.join(root, renameFiles[file] ?? file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    }
    else {
      copy(path.join(templateDir, file), targetPath);
    }
  };
  const files = fs.readdirSync(templateDir);
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file);
  }
  // 填充package.json
  const pkg = JSON.parse(fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8'));
  pkg.name = packageName || getProjectName();
  write('package.json', JSON.stringify(pkg, null, 2) + '\n');

  // 获取用户包管理器信息
  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';

  // 计算两个路径之间的相对路径
  const cdProjectName = path.relative(cwd, root);

  // 流程结束提示语生成
  console.log(`\nDone. Now run:\n`);
  if (root !== cwd) {
      console.log(lightCyan(`  cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName}`));
  }
  switch (pkgManager) {
      case 'yarn':
          console.log(lightCyan('  yarn'));
          console.log(lightCyan('  yarn dev'));
          break;
      default:
          console.log(lightCyan(`  ${pkgManager} install`));
          console.log(lightCyan(`  ${pkgManager} run dev`));
          break;
  }
}

/**
 * @description: 格式化包名,将项目名结尾 / 字符去掉
 * @param {String} targetDir
 * @return {*}
 */
function formatTargetDir(targetDir) {
  return targetDir?.trim().replace(/\/+$/g, '');
}

/**
 * @description: 判断目标路径是否为空，有git文件夹也判为空
 * @param {String} path 目标路径
 * @return {*}
 */
function isEmpty(path) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

/**
 * @description: 判断包名是否合法
 * @param {String} projectName 包名
 * @return {*}
 */
function isValidPackageName(projectName) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(projectName);
}

/**
 * @description: 将包名转为为合法名字
 * @param {String} projectName 包名
 * @return {*}
 */
function toValidPackageName(projectName) {
  return projectName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/^[._]/, '')
      .replace(/[^a-z\d\-~]+/g, '-');
}

/**
 * @description: 清空目标目录
 * @param {String} dir 目录
 * @return {*}
 */
function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
      return;
  }
  for (const file of fs.readdirSync(dir)) {
      if (file === '.git') {
          continue;
      }
      fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
}

/**
 * @description: 获取用户本地执行的包管理器信息
 * @param {String} userAgent 用户代理
 * @return {*}
 */
function pkgFromUserAgent(userAgent) {
  if (!userAgent)
      return undefined;
  const pkgSpec = userAgent.split(' ')[0];
  const pkgSpecArr = pkgSpec.split('/');
  return {
      name: pkgSpecArr[0],
      version: pkgSpecArr[1],
  };
}

/**
 * @description: 文件复制方法
 * @param {String} src 复制源地址
 * @param {String} dest 目标输出地址
 * @return {*}
 */
function copy(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  }
  else {
    fs.copyFileSync(src, dest);
  }
}

/**
 * @description: 目录复制方法
 * @param {String} srcDir 赋值源地址
 * @param {String} destDir 目标输出地址
 * @return {*}
 */
function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

init().catch((e) => {
  console.log(e);
});