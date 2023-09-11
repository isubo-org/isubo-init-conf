export function formatDesc(param) {
  const ret = {};
  const keys = Object.keys(param);
  const format = (desc = '') => {
    const descLines = desc.split('\n');
    const retDesc = descLines.slice(1, -1).join('\n');

    return retDesc;
  };
  for (let idx = 0; idx < keys.length; idx += 1) {
    const key = keys[idx];
    const it = param[key];
    ret[key] = {
      ...it,
      desc: format(it.desc)
    };
  }
  return ret;
}