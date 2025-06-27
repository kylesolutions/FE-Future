import './NavIcons.css';

function NavIcons({ onCategorySelect }) {
  return (
    <div className='container nav-icon'>
      <div className='icons-div' onClick={() => onCategorySelect('frame')}>
        <i className="bi bi-hash"></i>
        <p>FRAME</p>
      </div>
      <div className='icons-div' onClick={() => onCategorySelect('color')}>
        <i className="bi bi-palette-fill"></i>
        <p>COLOR</p>
      </div>
      <div className='icons-div' onClick={() => onCategorySelect('size')}>
        <i className="bi bi-box-arrow-up-right"></i>
        <p>SIZE</p>
      </div>
      <div className='icons-div' onClick={() => onCategorySelect('finish')}>
        <i className="bi bi-stars"></i>
        <p>FINISH</p>
      </div>
      <div className='icons-div' onClick={() => onCategorySelect('hanging')}>
        <i className="bi bi-bounding-box-circles"></i>
        <p>HANG</p>
      </div>
      <div className='icons-div' onClick={() => onCategorySelect('remove')}>
        <i className="bi bi-trash3-fill"></i>
        <p>REMOVE</p>
      </div>
    </div>
  );
}

export default NavIcons;