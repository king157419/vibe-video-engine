import {Composition} from 'remotion';
import {Brand, Ad} from './Films';
export const XmomoRoot: React.FC = () => (
	<>
		<Composition id="XmomoBrand" component={Brand} width={1280} height={720} fps={30} durationInFrames={900} defaultProps={{logo: ''}} />
		<Composition id="XmomoAd" component={Ad} width={1280} height={720} fps={30} durationInFrames={450} defaultProps={{logo: ''}} />
	</>
);
