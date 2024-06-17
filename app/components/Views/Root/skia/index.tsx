import { View, Dimensions, SafeAreaView, Button } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Path,
  Paint,
  LinearGradient,
  cartesian2Polar,
  vec,
  Skia,
  useTouchHandler,
  SkPath,
  PathCommand,
  PathVerb,
  usePathInterpolation,
} from '@shopify/react-native-skia';
import {
  Easing,
  cancelAnimation,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import data from './data.json';

const { width: windowWidth } = Dimensions.get('window');
const GRAPH_HEIGHT = windowWidth / 2;
const TOP_OFFSET = 200;
const POINTS = 50;
const COLORS = ['#F69D69', '#FFC37D', '#61E0A1', '#31CBD1'];
const values = data.data.prices as Prices;
const ADJUSTED_SIZE = GRAPH_HEIGHT - 16 * 2;

interface Amount {
  amount: string;
  currency: string;
  scale: string;
}

interface PercentChange {
  hour: number;
  day: number;
  week: number;
  month: number;
  year: number;
}

interface LatestPrice {
  amount: Amount;
  timestamp: string;
  percent_change: PercentChange;
}

interface Prices {
  latest: string;
  latest_price: LatestPrice;
  hour: DataPoints;
  day: DataPoints;
  week: DataPoints;
  month: DataPoints;
  year: DataPoints;
  all: DataPoints;
}

type PriceList = [string, number][];

interface DataPoints {
  percent_change: number;
  prices: PriceList;
}

interface Vector {
  x: number;
  y: number;
}

interface Cubic {
  from: Vector;
  c1: Vector;
  c2: Vector;
  to: Vector;
}

export const controlPoint = (
  current: Vector,
  previous: Vector,
  next: Vector,
  reverse: boolean,
  smoothing: number,
) => {
  'worklet';
  const p = previous || current;
  const n = next || current;

  // Properties of the opposed-line
  const lengthX = n.x - p.x;
  const lengthY = n.y - p.y;

  const o = cartesian2Polar({ x: lengthX, y: lengthY });
  // If is end-control-point, add PI to the angle to go backward
  const angle = o.theta + (reverse ? Math.PI : 0);
  const length = o.radius * smoothing;
  // The control point position is relative to the current point
  const x = current.x + Math.cos(angle) * length;
  const y = current.y + Math.sin(angle) * length;
  return { x: 0, y: 0 };
};

const drawLines = (points: Vector[]) => {
  const path = Skia.Path.Make();
  path.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const { x, y } = points[i];
    path.lineTo(x, y);
  }
  return path;
};

const drawCurvedLines = (
  points: Vector[],
  smoothing: number,
  strategy: 'complex' | 'bezier' | 'simple',
) => {
  'worklet';
  const path = Skia.Path.Make();
  path.moveTo(points[0].x, points[0].y);
  // build the d attributes by looping over the points
  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      continue;
    }
    const point = points[i];
    const next = points[i + 1];
    const prev = points[i - 1];
    const cps = controlPoint(prev, points[i - 2], point, false, smoothing);
    const cpe = controlPoint(point, prev, next, true, smoothing);
    switch (strategy) {
      case 'simple':
        const cp = {
          x: (cps.x + cpe.x) / 2,
          y: (cps.y + cpe.y) / 2,
        };
        path.quadTo(cp.x, cp.y, point.x, point.y);
        break;
      case 'bezier':
        const p0 = points[i - 2] || prev;
        const p1 = points[i - 1];
        const cp1x = (2 * p0.x + p1.x) / 3;
        const cp1y = (2 * p0.y + p1.y) / 3;
        const cp2x = (p0.x + 2 * p1.x) / 3;
        const cp2y = (p0.y + 2 * p1.y) / 3;
        const cp3x = (p0.x + 4 * p1.x + point.x) / 6;
        const cp3y = (p0.y + 4 * p1.y + point.y) / 6;
        path.cubicTo(cp1x, cp1y, cp2x, cp2y, cp3x, cp3y);
        if (i === points.length - 1) {
          path.cubicTo(
            points[points.length - 1].x,
            points[points.length - 1].y,
            points[points.length - 1].x,
            points[points.length - 1].y,
            points[points.length - 1].x,
            points[points.length - 1].y,
          );
        }
        break;
      case 'complex':
        path.cubicTo(cps.x, cps.y, cpe.x, cpe.y, point.x, point.y);
        break;
      default:
      //   exhaustiveCheck(strategy);
    }
  }
  return path;
};

const buildGraph = (dataPoints: DataPoints) => {
  const priceList = dataPoints.prices.slice(0, POINTS);
  const formattedValues = priceList
    .map((price) => [parseFloat(price[0]), price[1]])
    .reverse();
  const prices = formattedValues.map((value) => value[0]);
  const dates = formattedValues.map((value) => value[1]);
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const points = formattedValues.map(([price, date]) => {
    const x = ((date - minDate) / (maxDate - minDate)) * windowWidth;
    const y =
      ((price - minPrice) / (maxPrice - minPrice)) * ADJUSTED_SIZE + TOP_OFFSET;
    return { x, y };
  });
  points.push({ x: windowWidth + 10, y: points[points.length - 1].y });
  //   const path = drawCurvedLines(points, 0.2, 'simple');
  const path = drawLines(points);
  return path;
};

export const getCursorTransform = (path: SkPath, x: number, scale: number) => {
  'worklet';
  const cmds = path.toCmds();

  const index = Math.round(x / (windowWidth / cmds.length));

  const [_, xSnap, ySnap] = cmds[index];

  return [{ translateX: xSnap }, { translateY: ySnap }, { scale }];
};

export const getGraph = () =>
  // width: number, height: number
  {
    'worklet';
    return [
      {
        label: '1H',
        value: 0,
        data: buildGraph(values.hour),
      },
      {
        label: '1D',
        value: 1,
        data: buildGraph(values.day),
      },
      {
        label: '1M',
        value: 2,
        data: buildGraph(values.month),
      },
      {
        label: '1Y',
        value: 3,
        data: buildGraph(values.year),
      },
      {
        label: 'All',
        value: 4,
        data: buildGraph(values.all),
      },
    ];
  };

const Graph = () => {
  const graphs = getGraph();
  const transition = useSharedValue(0);
  const state = useSharedValue({
    current: 0,
    next: 0,
  });
  const path = useDerivedValue(() => {
    const start = graphs[state.value.current].data;
    const end = graphs[state.value.next].data;
    return end;
    // return end.interpolate(start, transition.value);
  }, [state, transition]);
  //   const path = useDerivedValue(() => getGraph()[state.value.current], [state]);
  const x = useSharedValue(0);
  const isActive = useSharedValue(false);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const transform = useDerivedValue(
    () => getCursorTransform(path.value, x.value, scale.value),
    [x, isActive],
  );

  const onTouch = useTouchHandler({
    onStart: (pt) => {
      x.value = pt.x;
      isActive.value = true;
      scale.value = withTiming(1, { easing: Easing.bounce, duration: 250 });
      opacity.value = 1;
      Haptics.impactAsync();
    },
    onEnd: () => {
      isActive.value = false;
      scale.value = 0;
      opacity.value = 0;
      Haptics.impactAsync();
    },
    onActive: (pt) => {
      x.value = pt.x;
    },
  });

  return (
    <View style={{ justifyContent: 'center', flex: 1 }}>
      <Canvas style={{ flex: 1 }} onTouch={onTouch}>
        <Group>
          <Path style={'stroke'} path={path} strokeWidth={4}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(windowWidth, 0)}
              colors={COLORS}
            />
          </Path>
          <Group transform={transform}>
            <Circle cx={0} cy={0} r={27} color={COLORS[0]} opacity={0.15} />
            <Circle cx={0} cy={0} r={18} color={COLORS[0]} opacity={0.15} />
            <Circle cx={0} cy={0} r={9} color={COLORS[0]}>
              <Paint
                style={'stroke'}
                strokeWidth={2}
                color={'white'}
                opacity={opacity}
              />
            </Circle>
          </Group>
        </Group>
      </Canvas>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          bottom: 200,
        }}
      >
        {graphs.map(({ label }, index) => (
          <Button
            key={`key-${label}`}
            title={label}
            onPress={() => {
              state.value = {
                current: state.value.next,
                next: index,
              };
              transition.value = 0;
              transition.value = withTiming(1, { duration: 500 });
            }}
            color={'black'}
          />
        ))}
      </View>
    </View>
  );
};

export default Graph;
