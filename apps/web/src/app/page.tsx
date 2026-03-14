import { ThreeItemGrid } from '../components/grid/three-items';
import { Carousel } from '../components/carousel';
import { Footer } from '../components/layout/footer';

export default function HomePage() {
  return (
    <>
      <ThreeItemGrid />
      <Carousel />
      <Footer />
    </>
  );
}
