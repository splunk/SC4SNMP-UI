import React from 'react';
import PropTypes from 'prop-types';

function ApplyChangesMessage({ message }) {
    const sections = message.split(/(?=\b(?:Inventory|Discovery):)/);

    return <span>{sections.map((section, index) => {
        const match = section.match(/^(Inventory|Discovery):\s*([\s\S]*)$/);
        if (!match) {
            return <span key={section}>{section}</span>;
        }
        const [, title, text] = match;
        const description = text.charAt(0).toUpperCase() + text.slice(1).trimEnd();
        return <span key={title} style={{ display: 'block', marginTop: index > 0 ? 16 : 0 }}>
            <strong>{title}</strong><br />
            {description.split(/(\b\d+(?:\.\d+)?)(?=\s+seconds?\b)/).map((part, partIndex) => (
                partIndex % 2 === 1
                    ? <strong key={part}>{part}</strong>
                    : part
            ))}
        </span>;
    })}</span>;
}

ApplyChangesMessage.propTypes = {
    message: PropTypes.string.isRequired,
};

export default ApplyChangesMessage;
