import {useState} from "react";
import {FaSearch} from "react-icons/fa";
import "./SearchBar.css";

const SearchBarComponent = () => {
    const [input, setInput] = useState("")

    return (
        <div className="input-wrapper">
            <FaSearch id="search-icon"/>
            <input 
                className="input"
                placeholder="Type to search a nearby hospital..." 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
            />
        </div>
    );
};

export default SearchBarComponent;