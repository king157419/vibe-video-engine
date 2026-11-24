import {Composition} from 'remotion';
import {FPS, makeCalc} from './lib/load';
import {H, W} from './lib/safe';
import {STYLES} from './styles';

export const RemotionRoot: React.FC = () => (
	<>
		{STYLES.map((s) => (
			<Composition
				key={s.id}
				id={s.id}
				component={s.component}
				width={W}
				height={H}
				fps={FPS}
				durationInFrames={300}
				defaultProps={{episode: 'demo', captions: null, meta: null}}
				calculateMetadata={makeCalc(s.tailMs)}
			/>
		))}
	</>
);
