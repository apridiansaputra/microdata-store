import Container from "./Container";
import Footer from "./Footer";
import Header from "./Header";
import Menu from "./Menu";

export default function Navbar () {
    return (
        <div className="py-6 border-b border-gray-200 mb-6">
            <Container className="flex flex-col gap-6">
                <Header />
                <Menu />
            </Container>
        </div>
    )
}