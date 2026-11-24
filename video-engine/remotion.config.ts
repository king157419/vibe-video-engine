import {Config} from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709'); // 否则会输出 full-range / bt470bg，上传后颜色发灰
Config.setOverwriteOutput(true);
